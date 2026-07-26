const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g. 'verify_approve', 'user_suspend', 'report_action'
    targetType: { type: String, required: true }, // 'user' | 'listing' | 'report' | 'verification'
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // additional context (file hashes, etc.)
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
