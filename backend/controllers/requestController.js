const Request = require('../models/Request');

// POST /api/requests
async function createRequest(req, res, next) {
  try {
    const { title, author, subject, urgency } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const request = await Request.create({
      requester: req.user._id,
      title, author, subject,
      urgency: urgency || 'medium',
    });
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
}

// GET /api/requests/mine
async function getMyRequests(req, res, next) {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .sort({ createdAt: -1 })
      .populate('matchedListings', 'title photos type price status');
    res.json({ requests });
  } catch (err) {
    next(err);
  }
}

// GET /api/requests/matches/:id - matched listings for a specific request
async function getRequestMatches(req, res, next) {
  try {
    const request = await Request.findById(req.params.id).populate(
      'matchedListings',
      'title photos type price status condition'
    );
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ matches: request.matchedListings });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRequest, getMyRequests, getRequestMatches };
