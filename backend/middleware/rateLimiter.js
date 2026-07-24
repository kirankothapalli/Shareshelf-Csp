const rateLimit = require('express-rate-limit');

// Loose general limiter for the whole API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limiter for auth endpoints (brute force / OTP abuse protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later.' },
});

// Rate-limit listing creation per account (loophole #14: spam listings/bot accounts)
const listingCreateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  message: { error: 'Daily listing creation limit reached. Try again tomorrow.' },
});

module.exports = { generalLimiter, authLimiter, listingCreateLimiter };
