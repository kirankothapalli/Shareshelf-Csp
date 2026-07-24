function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
}

// Requires the user to be an approved student, school, or admin (used to gate donate/sell + claim actions)
function requireVerified(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role === 'admin') return next();
  if (req.user.role === 'public') return next(); // public donors only need OTP verification (handled at signup)
  if (req.user.verification.status !== 'approved') {
    return res.status(403).json({ error: 'Account verification required for this action' });
  }
  next();
}

module.exports = { requireRole, requireVerified };
