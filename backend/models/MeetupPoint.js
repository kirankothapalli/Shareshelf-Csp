const mongoose = require('mongoose');

const MeetupPointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Green Valley School - Main Gate"
    locality: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin who approved it
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MeetupPointSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('MeetupPoint', MeetupPointSchema);
