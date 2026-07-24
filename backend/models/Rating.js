const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema(
  {
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'TransactionRequest', required: true, index: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    response: { type: String, default: null }, // rated user can respond to a review
  },
  { timestamps: true }
);

// one rating per (transaction, fromUser) pair - prevents double-rating the same transaction
RatingSchema.index({ transaction: 1, fromUser: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
