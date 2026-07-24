const MeetupPoint = require('../models/MeetupPoint');

// GET /api/meetup-points?near=lat,lng
async function getMeetupPoints(req, res, next) {
  try {
    const { near } = req.query;
    const filter = { active: true };

    if (near) {
      const [lat, lng] = near.split(',').map(Number);
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 25000, // 25km, slightly beyond listing radius
        },
      };
    }

    const points = await MeetupPoint.find(filter).limit(50);
    res.json({ points });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/meetup-points - admin adds a pre-approved safe meetup spot
async function createMeetupPoint(req, res, next) {
  try {
    const { name, locality, lng, lat } = req.body;
    if (!name || lng === undefined || lat === undefined) {
      return res.status(400).json({ error: 'name, lng, lat are required' });
    }
    const point = await MeetupPoint.create({
      name, locality,
      location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
      addedBy: req.user._id,
    });
    res.status(201).json({ point });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMeetupPoints, createMeetupPoint };
