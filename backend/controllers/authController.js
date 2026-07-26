const fs = require('fs');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const User = require('../models/User');
const VerificationHash = require('../models/VerificationHash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendOTP, verifyOTP } = require('../utils/otp');
const { hashDocNumber, hashDocFile } = require('../utils/hash');

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenVersion;
  return obj;
}

// POST /api/auth/signup
// Handles student/school signup
async function signup(req, res, next) {
  try {
    const { name, email, password, role, docType, docNumber, nameOnDoc } = req.body;

    if (!name || !role) return res.status(400).json({ error: 'name and role are required' });
    if (!['student', 'school', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (role === 'admin') return res.status(403).json({ error: 'Admin accounts cannot self-register' });

    if (!email || !validator.isEmail(email)) return res.status(400).json({ error: 'Valid email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    // Validate verification upload
    if (!['id_card', 'fee_receipt', 'institution_doc'].includes(docType)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Invalid document type' });
    }
    if (!docNumber) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'Document ID/receipt number is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      fs.unlink(req.file.path, () => {});
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const docHash = hashDocNumber(docNumber);

    // Duplicate detection: check doc number hash against existing users
    const duplicate = await User.findOne({ 'verification.docHash': docHash });
    if (duplicate) {
      fs.unlink(req.file.path, () => {});
      return res.status(409).json({ error: 'This ID/receipt number is already associated with another account' });
    }

    // Also check against the VerificationHash collection for previously verified docs
    const hashRecord = await VerificationHash.findOne({ docNumberHash: docHash, status: 'active' });
    if (hashRecord) {
      fs.unlink(req.file.path, () => {});
      return res.status(409).json({ error: 'This ID/receipt number has already been verified on another account' });
    }

    // Compute SHA-256 hash of the uploaded file content
    let fileHash = null;
    try {
      fileHash = await hashDocFile(req.file.path);
    } catch {
      // Non-fatal
    }

    // Check file content hash for content-level duplicate detection
    if (fileHash) {
      const filedup = await VerificationHash.findOne({ fileHash, status: 'active' });
      if (filedup) {
        fs.unlink(req.file.path, () => {});
        return res.status(409).json({ error: 'This document file has already been used for verification' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userData = {
      name,
      role,
      email,
      passwordHash,
      verification: { 
        status: 'pending',
        docType,
        docHash,
        docUploadPath: req.file.path,
        fileHash,
      },
    };

    const user = await User.create(userData);

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.status(201).json({ user: sanitizeUser(user), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    let { email, password } = req.body;
    if (email) email = email.trim();
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isSuspended) return res.status(403).json({ error: 'Account suspended', reason: user.suspensionReason });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.json({ user: sanitizeUser(user), accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh - refresh token rotation
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if ((user.refreshTokenVersion || 0) !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Refresh token has been revoked' });
    }

    // rotate: bump version so the old refresh token can't be reused
    user.refreshTokenVersion += 1;
    await user.save();

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

module.exports = { signup, login, refresh, sanitizeUser };
