const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, default: '' },
    subject: { type: String, default: '' },
    urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['open', 'matched', 'fulfilled', 'closed'], default: 'open', index: true },
    matchedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  },
  { timestamps: true }
);

RequestSchema.index({ title: 'text', subject: 'text', author: 'text' });

module.exports = mongoose.model('Request', RequestSchema);
