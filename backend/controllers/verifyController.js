const fs = require('fs');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const { hashDocNumber } = require('../utils/hash');
const { emitToUser } = require('../utils/socket');
const { sendEmail } = require('../utils/email');

// POST /api/verify/upload - student/school uploads ID card or fee receipt (image/PDF) + declared doc number
async function uploadVerification(req, res, next) {
  try {
    const { docType, docNumber, nameOnDoc } = req.body;
    if (!['id_card', 'fee_receipt', 'institution_doc'].includes(docType)) {
      return res.status(400).json({ error: 'Invalid docType' });
    }
    if (!docNumber) return res.status(400).json({ error: 'docNumber is required for duplicate-account detection' });
    if (!req.file) return res.status(400).json({ error: 'Document file is required' });

    const docHash = hashDocNumber(docNumber);

    // Loophole #2 mitigation: block duplicate hash on signup/verification
    const duplicate = await User.findOne({
      'verification.docHash': docHash,
      _id: { $ne: req.user._id },
    });
    if (duplicate) {
      // discard the uploaded file immediately - we never keep docs tied to a flagged duplicate
      fs.unlink(req.file.path, () => {});
      return res.status(409).json({ error: 'This ID/receipt number is already associated with another account' });
    }

    const user = req.user;
    user.verification.status = 'pending';
    user.verification.docType = docType;
    user.verification.docHash = docHash;
    user.verification.docUploadPath = req.file.path; // temporary - purged post-review
    user.verification.rejectionReason = null;
    user.verification.reviewedBy = null;
    user.verification.reviewedAt = null;
    // soft name-match note passed along for the admin, not stored on the permanent record
    await user.save();

    res.json({
      message: 'Verification submitted and pending admin review',
      status: user.verification.status,
      nameOnDocProvided: nameOnDoc || null,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/verify/status
async function getVerificationStatus(req, res, next) {
  res.json({ verification: req.user.verification });
}

// PATCH /api/admin/verify/:userId - admin approve/reject
async function reviewVerification(req, res, next) {
  try {
    const { userId } = req.params;
    const { decision, reason } = req.body; // decision: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be approved or rejected' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.verification.status !== 'pending') {
      return res.status(400).json({ error: 'No pending verification for this user' });
    }

    user.verification.status = decision;
    user.verification.reviewedBy = req.user._id;
    user.verification.reviewedAt = new Date();
    if (decision === 'rejected') user.verification.rejectionReason = reason || 'Not specified';

    // Privacy safeguard: auto-delete the raw uploaded doc once reviewed either way
    if (user.verification.docUploadPath) {
      fs.unlink(user.verification.docUploadPath, () => {});
      user.verification.docUploadPath = null;
    }

    await user.save();

    await AdminAuditLog.create({
      admin: req.user._id,
      action: decision === 'approved' ? 'verify_approve' : 'verify_reject',
      targetType: 'verification',
      targetId: user._id,
      reason: reason || '',
    });

    emitToUser(user._id, 'verification:updated', { status: decision });
    if (user.email) {
      sendEmail({
        to: user.email,
        subject: `ShareShelf verification ${decision}`,
        text: `Your verification was ${decision}.${reason ? ` Reason: ${reason}` : ''}`,
      });
    }

    res.json({ message: `Verification ${decision}`, verification: user.verification });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadVerification, getVerificationStatus, reviewVerification };
