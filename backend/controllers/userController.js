const User = require('../models/User');
const Report = require('../models/Report');
const Listing = require('../models/Listing');

// GET /api/users/:id - public profile view (ratings, verified badge, active listings)
async function getUserProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select(
      'name role verification.status rating createdAt location.areaLabel'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    const activeListings = await Listing.find({ owner: user._id, status: 'active' })
      .select('title category photos type price condition createdAt')
      .limit(20);

    res.json({ user, activeListings });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/me
async function updateMe(req, res, next) {
  try {
    const allowed = ['name', 'guardianContact'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/users/me/location
async function updateMyLocation(req, res, next) {
  try {
    const { lng, lat, areaLabel } = req.body;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      return res.status(400).json({ error: 'lng and lat (numbers) are required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { location: { type: 'Point', coordinates: [lng, lat], areaLabel: areaLabel || '' } },
      { new: true }
    );
    res.json({ location: user.location });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/:id/report
async function reportUser(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot report yourself' });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      targetType: 'user',
      targetId: req.params.id,
      reason,
    });

    res.status(201).json({ message: 'Report submitted', report });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUserProfile, updateMe, updateMyLocation, reportUser };
