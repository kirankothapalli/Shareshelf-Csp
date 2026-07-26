const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },

    role: {
      type: String,
      enum: ['student', 'school', 'admin'],
      default: 'student',
      required: true,
    },

    verification: {
      status: {
        type: String,
        enum: ['unverified', 'pending', 'approved', 'rejected'],
        default: 'unverified',
      },
      docType: {
        type: String,
        enum: ['id_card', 'fee_receipt', 'institution_doc', null],
        default: null,
      },
      // hash of the ID/receipt number only - raw document is never persisted long-term
      docHash: { type: String, default: null, index: true },
      docUploadPath: { type: String, default: null }, // temp path, purged post-review
      fileHash: { type: String, default: null }, // SHA-256 of uploaded file content
      anonymizedRefId: { type: String, default: null }, // UUID-v4 link to VerificationHash record
      rejectionReason: { type: String, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      reviewedAt: { type: Date, default: null },
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      areaLabel: { type: String, default: '' }, // public-facing approximate label
    },

    guardianContact: { type: String, default: null }, // for minors / school-level students

    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, default: null },

    refreshTokenVersion: { type: Number, default: 0 }, // bump to invalidate old refresh tokens
  },
  { timestamps: true }
);

UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
