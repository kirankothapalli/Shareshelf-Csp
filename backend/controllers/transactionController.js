const TransactionRequest = require('../models/TransactionRequest');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { emitToUser } = require('../utils/socket');
const { sendEmail } = require('../utils/email');

// POST /api/transactions - create request-to-claim on a listing
async function createTransaction(req, res, next) {
  try {
    const { listingId } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.status !== 'active') return res.status(400).json({ error: 'Listing is not currently available' });
    if (listing.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot request your own listing' });
    }

    const txn = await TransactionRequest.create({
      listing: listing._id,
      requester: req.user._id,
      owner: listing.owner,
    });

    listing.status = 'requested';
    await listing.save();

    emitToUser(listing.owner, 'request:new', {
      transactionId: txn._id,
      listingId: listing._id,
      listingTitle: listing.title,
      requesterName: req.user.name,
    });

    const owner = await User.findById(listing.owner);
    if (owner?.email) {
      sendEmail({
        to: owner.email,
        subject: 'New request on your listing',
        text: `${req.user.name} requested "${listing.title}". Review it in your dashboard.`,
      });
    }

    res.status(201).json({ transaction: txn });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/transactions/:id/accept
async function acceptTransaction(req, res, next) {
  try {
    const txn = await TransactionRequest.findById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.owner.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not your listing request' });
    if (txn.status !== 'pending') return res.status(400).json({ error: 'Transaction is not pending' });

    const { meetupPointName, meetupCoordinates } = req.body;

    txn.status = 'accepted';
    txn.contactRevealed = true; // gate: contact only revealed upon acceptance
    if (meetupPointName) {
      txn.meetupPoint = { name: meetupPointName, coordinates: meetupCoordinates || null };
    }
    await txn.save();

    const listing = await Listing.findById(txn.listing);
    if (listing) {
      listing.status = 'reserved';
      await listing.save();
    }

    emitToUser(txn.requester, 'request:accepted', { transactionId: txn._id });

    const requester = await User.findById(txn.requester);
    const owner = await User.findById(txn.owner);
    res.json({
      transaction: txn,
      contacts: {
        requester: { name: requester.name, phone: requester.phone, email: requester.email },
        owner: { name: owner.name, phone: owner.phone, email: owner.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/transactions/:id/decline
async function declineTransaction(req, res, next) {
  try {
    const txn = await TransactionRequest.findById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.owner.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not your listing request' });
    if (txn.status !== 'pending') return res.status(400).json({ error: 'Transaction is not pending' });

    txn.status = 'declined';
    await txn.save();

    const listing = await Listing.findById(txn.listing);
    if (listing && listing.status === 'requested') {
      listing.status = 'active';
      await listing.save();
    }

    emitToUser(txn.requester, 'request:declined', { transactionId: txn._id });
    res.json({ transaction: txn });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/transactions/:id/complete - both parties must confirm
async function completeTransaction(req, res, next) {
  try {
    const txn = await TransactionRequest.findById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const uid = req.user._id.toString();
    if (![txn.owner.toString(), txn.requester.toString()].includes(uid)) {
      return res.status(403).json({ error: 'Not a party to this transaction' });
    }
    if (txn.status !== 'accepted') return res.status(400).json({ error: 'Transaction must be accepted first' });

    if (!txn.completionConfirmedBy.some((id) => id.toString() === uid)) {
      txn.completionConfirmedBy.push(req.user._id);
    }

    const bothConfirmed =
      txn.completionConfirmedBy.some((id) => id.toString() === txn.owner.toString()) &&
      txn.completionConfirmedBy.some((id) => id.toString() === txn.requester.toString());

    if (bothConfirmed) {
      txn.status = 'completed';
      txn.completedAt = new Date();
      const listing = await Listing.findById(txn.listing);
      if (listing) {
        listing.status = 'completed';
        await listing.save();
      }
    }

    await txn.save();
    res.json({ transaction: txn, bothConfirmed });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/transactions/:id/no-show
async function markNoShow(req, res, next) {
  try {
    const txn = await TransactionRequest.findById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    const uid = req.user._id.toString();
    if (![txn.owner.toString(), txn.requester.toString()].includes(uid)) {
      return res.status(403).json({ error: 'Not a party to this transaction' });
    }
    if (txn.status !== 'accepted') return res.status(400).json({ error: 'Transaction must be accepted to mark a no-show' });

    txn.status = 'no_show';
    txn.noShowReportedBy = req.user._id;
    await txn.save();

    // No-show tracking factors into rating/flags - counted at read time in admin stats/report review.
    res.json({ transaction: txn });
  } catch (err) {
    next(err);
  }
}

// GET /api/transactions/mine
async function getMyTransactions(req, res, next) {
  try {
    const uid = req.user._id;
    const transactions = await TransactionRequest.find({ $or: [{ owner: uid }, { requester: uid }] })
      .sort({ createdAt: -1 })
      .populate('listing', 'title photos type price status')
      .populate('owner', 'name')
      .populate('requester', 'name');
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTransaction, acceptTransaction, declineTransaction,
  completeTransaction, markNoShow, getMyTransactions,
};
