const Message = require('../models/Message');
const TransactionRequest = require('../models/TransactionRequest');
const { emitToTransaction } = require('../utils/socket');

async function assertParty(txnId, userId) {
  const txn = await TransactionRequest.findById(txnId);
  if (!txn) return { error: 'Transaction not found', status: 404 };
  if (![txn.owner.toString(), txn.requester.toString()].includes(userId.toString())) {
    return { error: 'Not a party to this transaction', status: 403 };
  }
  if (!['accepted', 'completed'].includes(txn.status)) {
    return { error: 'Chat unlocks only after the request is accepted', status: 403 };
  }
  return { txn };
}

// GET /api/messages/:transactionId
async function getMessages(req, res, next) {
  try {
    const check = await assertParty(req.params.transactionId, req.user._id);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const messages = await Message.find({ transaction: req.params.transactionId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name');
    res.json({ messages });
  } catch (err) {
    next(err);
  }
}

// POST /api/messages/:transactionId
async function postMessage(req, res, next) {
  try {
    const check = await assertParty(req.params.transactionId, req.user._id);
    if (check.error) return res.status(check.status).json({ error: check.error });

    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });

    const message = await Message.create({
      transaction: req.params.transactionId,
      sender: req.user._id,
      text: text.trim(),
    });

    const populated = await message.populate('sender', 'name');
    emitToTransaction(req.params.transactionId, 'message:new', populated);

    res.status(201).json({ message: populated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, postMessage };
