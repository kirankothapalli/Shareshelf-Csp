const Rating = require('../models/Rating');
const TransactionRequest = require('../models/TransactionRequest');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');

const FLAG_THRESHOLD_AVG = 2.5;
const FLAG_MIN_COUNT = 5;

// POST /api/ratings
async function createRating(req, res, next) {
  try {
    const { transactionId, stars, comment } = req.body;
    if (!transactionId || !stars) return res.status(400).json({ error: 'transactionId and stars are required' });
    if (stars < 1 || stars > 5) return res.status(400).json({ error: 'stars must be between 1 and 5' });

    const txn = await TransactionRequest.findById(transactionId);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    if (txn.status !== 'completed') {
      return res.status(400).json({ error: 'Ratings only unlock after a confirmed, completed transaction' });
    }

    const uid = req.user._id.toString();
    const otherPartyId = txn.owner.toString() === uid ? txn.requester : txn.owner;
    if (![txn.owner.toString(), txn.requester.toString()].includes(uid)) {
      return res.status(403).json({ error: 'Not a party to this transaction' });
    }

    const rating = await Rating.create({
      transaction: txn._id,
      fromUser: req.user._id,
      toUser: otherPartyId,
      stars,
      comment: comment || '',
    });

    // recompute aggregate rating for the rated user
    const toUser = await User.findById(otherPartyId);
    const newCount = toUser.rating.count + 1;
    const newAvg = (toUser.rating.avg * toUser.rating.count + stars) / newCount;
    toUser.rating.avg = Number(newAvg.toFixed(2));
    toUser.rating.count = newCount;
    await toUser.save();

    // Auto-flag for admin review (not auto-ban) - loophole #5 mitigation
    if (newCount >= FLAG_MIN_COUNT && newAvg < FLAG_THRESHOLD_AVG) {
      await AdminAuditLog.create({
        admin: req.user._id, // system-triggered, logged against the rater for traceability
        action: 'auto_flag_low_rating',
        targetType: 'user',
        targetId: toUser._id,
        reason: `Average rating ${newAvg.toFixed(2)} after ${newCount} ratings`,
      });
    }

    res.status(201).json({ rating });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'You already rated this transaction' });
    next(err);
  }
}

// GET /api/ratings/user/:id
async function getUserRatings(req, res, next) {
  try {
    const ratings = await Rating.find({ toUser: req.params.id })
      .sort({ createdAt: -1 })
      .populate('fromUser', 'name');
    const user = await User.findById(req.params.id).select('rating');
    res.json({ ratings, summary: user ? user.rating : { avg: 0, count: 0 } });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/ratings/:id/respond - rated user can respond to a review (loophole #5 mitigation)
async function respondToRating(req, res, next) {
  try {
    const { response } = req.body;
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).json({ error: 'Rating not found' });
    if (rating.toUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the rated user can respond' });
    }
    rating.response = response;
    await rating.save();
    res.json({ rating });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRating, getUserRatings, respondToRating };
