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

// GET /api/requests — public, returns all open requests
async function getAllOpenRequests(req, res, next) {
  try {
    const { search, urgency } = req.query;
    const filter = { status: 'open' };
    if (urgency && ['low', 'medium', 'high'].includes(urgency)) {
      filter.urgency = urgency;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort: high urgency first, then newest
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    const requests = await Request.find(filter)
      .sort({ createdAt: -1 })
      .populate('requester', 'name')
      .limit(100)
      .lean();

    // In-memory sort by urgency priority (Mongo can't sort by custom enum order easily)
    requests.sort((a, b) => (urgencyOrder[a.urgency] ?? 1) - (urgencyOrder[b.urgency] ?? 1));

    res.json({ requests, total: requests.length });
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

module.exports = { createRequest, getAllOpenRequests, getMyRequests, getRequestMatches };

