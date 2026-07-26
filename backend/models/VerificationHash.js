const mongoose = require('mongoose');

const VerificationHashSchema = new mongoose.Schema(
  {
    // SHA-256 hash of the document number (same as User.verification.docHash)
    docNumberHash: { type: String, required: true, index: true },

    // SHA-256 hash of the uploaded file content (binary hash for content-level dedup)
    fileHash: { type: String, default: null, index: true },

    algorithm: { type: String, default: 'sha256' }, // future-proofed for algo rotation

    docType: {
      type: String,
      enum: ['id_card', 'fee_receipt', 'institution_doc'],
      required: true,
    },

    // UUID-v4 anonymized reference — NOT linkable to the user
    anonymizedRefId: { type: String, required: true, unique: true },

    // Verification metadata
    verifiedAt: { type: Date, required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },

    // Deletion confirmation — proof the file was destroyed
    fileDeletionConfirmed: { type: Boolean, default: false },
    fileDeletionTimestamp: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index for efficient duplicate lookups
VerificationHashSchema.index({ docNumberHash: 1, status: 1 });
VerificationHashSchema.index({ fileHash: 1, status: 1 });

module.exports = mongoose.model('VerificationHash', VerificationHashSchema);
