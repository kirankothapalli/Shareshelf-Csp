const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const AdminAuditLog = require('../models/AdminAuditLog');
const VerificationHash = require('../models/VerificationHash');
const { hashDocNumber, hashDocFile, generateAnonymizedRefId } = require('../utils/hash');
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

    // Duplicate detection: check doc number hash against existing users
    const duplicate = await User.findOne({
      'verification.docHash': docHash,
      _id: { $ne: req.user._id },
    });
    if (duplicate) {
      // discard the uploaded file immediately - we never keep docs tied to a flagged duplicate
      fs.unlink(req.file.path, () => {});
      return res.status(409).json({ error: 'This ID/receipt number is already associated with another account' });
    }

    // Also check against the VerificationHash collection for previously verified docs
    const hashRecord = await VerificationHash.findOne({
      docNumberHash: docHash,
      status: 'active',
    });
    if (hashRecord) {
      fs.unlink(req.file.path, () => {});
      return res.status(409).json({ error: 'This ID/receipt number has already been verified on another account' });
    }

    // Compute SHA-256 hash of the uploaded file content
    let fileHash = null;
    try {
      fileHash = await hashDocFile(req.file.path);
    } catch {
      // Non-fatal: proceed without file hash if computation fails
    }

    // Check file content hash for content-level duplicate detection
    if (fileHash) {
      const filedup = await VerificationHash.findOne({
        fileHash,
        status: 'active',
      });
      if (filedup) {
        fs.unlink(req.file.path, () => {});
        return res.status(409).json({ error: 'This document file has already been used for verification' });
      }
    }

    const user = req.user;
    user.verification.status = 'pending';
    user.verification.docType = docType;
    user.verification.docHash = docHash;
    user.verification.docUploadPath = req.file.path; // temporary - purged post-review
    user.verification.fileHash = fileHash;
    user.verification.rejectionReason = null;
    user.verification.reviewedBy = null;
    user.verification.reviewedAt = null;
    user.verification.anonymizedRefId = null;
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

    const auditMetadata = {};

    if (decision === 'approved') {
      // Create a VerificationHash record for long-term audit trail
      const anonymizedRefId = generateAnonymizedRefId();
      user.verification.anonymizedRefId = anonymizedRefId;

      await VerificationHash.create({
        docNumberHash: user.verification.docHash,
        fileHash: user.verification.fileHash || null,
        algorithm: 'sha256',
        docType: user.verification.docType,
        anonymizedRefId,
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        status: 'active',
        fileDeletionConfirmed: false,
      });

      auditMetadata.anonymizedRefId = anonymizedRefId;
      auditMetadata.docNumberHashPrefix = user.verification.docHash?.substring(0, 12) + '…';
      if (user.verification.fileHash) {
        auditMetadata.fileHashPrefix = user.verification.fileHash.substring(0, 12) + '…';
      }
    }

    // Privacy safeguard: securely delete the raw uploaded doc once reviewed either way
    if (user.verification.docUploadPath) {
      const filePath = user.verification.docUploadPath;
      auditMetadata.deletedFile = path.basename(filePath);

      try {
        // Delete the file
        await fs.promises.unlink(filePath);

        // Verify deletion
        try {
          await fs.promises.access(filePath);
          // If we get here, file still exists — flag it
          auditMetadata.deletionVerified = false;
          console.error(`[verify] File deletion verification failed: ${filePath}`);
        } catch {
          // File not accessible — deletion confirmed
          auditMetadata.deletionVerified = true;

          // Update the VerificationHash record if approved
          if (decision === 'approved' && user.verification.anonymizedRefId) {
            await VerificationHash.findOneAndUpdate(
              { anonymizedRefId: user.verification.anonymizedRefId },
              { fileDeletionConfirmed: true, fileDeletionTimestamp: new Date() }
            );
          }
        }
      } catch (err) {
        console.error(`[verify] Failed to delete file: ${filePath}`, err.message);
        auditMetadata.deletionError = err.message;
      }

      user.verification.docUploadPath = null;
    }

    // Clear file hash from user document after review (only the VerificationHash record keeps it)
    user.verification.fileHash = null;

    await user.save();

    await AdminAuditLog.create({
      admin: req.user._id,
      action: decision === 'approved' ? 'verify_approve' : 'verify_reject',
      targetType: 'verification',
      targetId: user._id,
      reason: reason || '',
      metadata: auditMetadata,
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

// GET /api/admin/verify/:userId/document - serve verification doc for admin review
async function getVerificationDocument(req, res, next) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.verification.status !== 'pending') {
      return res.status(400).json({ error: 'Document only available during pending review' });
    }

    if (!user.verification.docUploadPath) {
      return res.status(404).json({ error: 'No document file found' });
    }

    // Verify file exists
    try {
      await fs.promises.access(user.verification.docUploadPath);
    } catch {
      return res.status(404).json({ error: 'Document file not found on disk' });
    }

    // Log the access for audit trail
    await AdminAuditLog.create({
      admin: req.user._id,
      action: 'doc_viewed',
      targetType: 'verification',
      targetId: user._id,
      reason: 'Admin viewed verification document during review',
      metadata: { fileName: path.basename(user.verification.docUploadPath) },
    });

    // Serve with security headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });

    res.sendFile(path.resolve(user.verification.docUploadPath));
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadVerification, getVerificationStatus, reviewVerification, getVerificationDocument };
