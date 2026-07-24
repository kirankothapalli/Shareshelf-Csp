const mongoose = require('mongoose');

const TransactionRequestSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true,
    },

    meetupPoint: {
      name: { type: String, default: null },
      coordinates: { type: [Number], default: null }, // [lng, lat]
    },

    contactRevealed: { type: Boolean, default: false },

    noShowReportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    completedAt: { type: Date, default: null },

    // both sides must confirm completion independently
    completionConfirmedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransactionRequest', TransactionRequestSchema);
