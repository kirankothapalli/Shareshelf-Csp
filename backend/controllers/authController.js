const bcrypt = require('bcryptjs');
const validator = require('validator');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendOTP, verifyOTP } = require('../utils/otp');

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenVersion;
  return obj;
}

// POST /api/auth/signup
// Handles student/school signup (email+password) and lighter public-donor path (phone, verified via OTP separately)
async function signup(req, res, next) {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !role) return res.status(400).json({ error: 'name and role are required' });
    if (!['student', 'public', 'school', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (role === 'admin') return res.status(403).json({ error: 'Admin accounts cannot self-register' });

    if (email && !validator.isEmail(email)) return res.status(400).json({ error: 'Invalid email' });

    if ((role === 'student' || role === 'school') && (!email || !password)) {
      return res.status(400).json({ error: 'Student/school signup requires email and password' });
    }
    if (role === 'public' && !phone) {
      return res.status(400).json({ error: 'Public donor signup requires a phone number' });
    }

    const existing = await User.findOne({
      $or: [email ? { email } : null, phone ? { phone } : null].filter(Boolean),
    });
    if (existing) return res.status(409).json({ error: 'An account with this email/phone already exists' });

    const userData = { name, email, phone, role };
    if (password) userData.passwordHash = await bcrypt.hash(password, 10);

    // school accounts still go through a verification step (institution doc), same as students
    if (role === 'student' || role === 'school') {
      userData.verification = { status: 'unverified' };
    } else if (role === 'public') {
      userData.verification = { status: 'unverified' }; // becomes 'approved' immediately after OTP verify
    }

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
    let { emailOrPhone, password } = req.body;
    if (emailOrPhone) emailOrPhone = emailOrPhone.trim();
    if (!emailOrPhone || !password) return res.status(400).json({ error: 'emailOrPhone and password required' });

    const user = await User.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }],
    }).select('+passwordHash');

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

// POST /api/auth/otp/send - public donor phone verification
async function otpSend(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    await sendOTP(phone);
    res.json({ message: 'OTP sent' });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/otp/verify
async function otpVerify(req, res, next) {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

    const valid = verifyOTP(phone, code);
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const user = await User.findOne({ phone });
    if (user && user.role === 'public') {
      user.verification.status = 'approved';
      await user.save();
    }

    res.json({ message: 'Phone verified', verified: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh, otpSend, otpVerify, sanitizeUser };
