const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['book', 'stationery', 'equipment', 'other'],
      required: true,
    },
    subject: { type: String, default: '' },
    department: { type: String, default: '' },
    semester: { type: String, default: '' },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor'],
      required: true,
    },
    description: { type: String, default: '' },

    photos: {
      type: [String],
      validate: {
        validator: (arr) => arr.length >= 1 && arr.length <= 6,
        message: 'A listing needs between 1 and 6 photos.',
      },
      required: true,
    },

    type: { type: String, enum: ['Free', 'Paid'], required: true },
    price: { type: Number, default: 0 },
    originalPriceDeclared: { type: Number, default: 0 },
    quantity: { type: Number, default: 1, min: 1 },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], default: [0, 0] },
      areaLabel: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['active', 'requested', 'reserved', 'completed', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },

    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

ListingSchema.index({ location: '2dsphere' });
ListingSchema.index({ title: 'text', subject: 'text', description: 'text' });

// soft price-cap validation: paid listings must be below self-declared original price
ListingSchema.pre('validate', function (next) {
  if (this.type === 'Paid') {
    if (!this.originalPriceDeclared || this.originalPriceDeclared <= 0) {
      return next(new Error('originalPriceDeclared is required for Paid listings.'));
    }
    if (this.price >= this.originalPriceDeclared) {
      return next(new Error('price must be below the declared original price for Paid listings.'));
    }
  }
  next();
});

module.exports = mongoose.model('Listing', ListingSchema);
