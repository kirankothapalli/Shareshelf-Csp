const Listing = require('../models/Listing');
const Report = require('../models/Report');
const Request = require('../models/Request');
const { emitToUser } = require('../utils/socket');
const { sendEmail } = require('../utils/email');
const User = require('../models/User');

const DEFAULT_RADIUS_KM = Number(process.env.DEFAULT_SEARCH_RADIUS_KM) || 20;

// POST /api/listings
async function createListing(req, res, next) {
  try {
    const {
      title, category, subject, department, semester, condition, description,
      type, price, originalPriceDeclared, quantity, lng, lat, areaLabel,
    } = req.body;

    const photos = (req.files || []).map((f) => `/uploads/${f.filename}`);
    if (photos.length < 1) return res.status(400).json({ error: 'At least 1 photo is required' });
    if (photos.length > 6) return res.status(400).json({ error: 'Maximum 6 photos allowed' });

    const coords =
      lng !== undefined && lat !== undefined
        ? [Number(lng), Number(lat)]
        : req.user.location.coordinates;

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const listing = await Listing.create({
      owner: req.user._id,
      title, category, subject, department, semester, condition, description,
      photos,
      type,
      price: type === 'Paid' ? Number(price) : 0,
      originalPriceDeclared: type === 'Paid' ? Number(originalPriceDeclared) : 0,
      quantity: quantity ? Number(quantity) : 1,
      location: {
        type: 'Point',
        coordinates: coords,
        areaLabel: areaLabel || req.user.location.areaLabel || '',
      },
      expiresAt,
    });

    // Loophole #? / feature 4.3: auto-match against open requests and notify
    matchAgainstOpenRequests(listing).catch((e) => console.error('match error', e.message));

    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

async function matchAgainstOpenRequests(listing) {
  const regex = new RegExp(listing.title.split(' ').filter(Boolean).join('|'), 'i');
  const candidates = await Request.find({
    status: 'open',
    $or: [{ title: regex }, { subject: listing.subject || '' }],
  }).populate('requester', 'email name');

  for (const reqDoc of candidates) {
    reqDoc.status = 'matched';
    reqDoc.matchedListings.push(listing._id);
    await reqDoc.save();

    emitToUser(reqDoc.requester._id, 'listing:matched', {
      requestId: reqDoc._id,
      listing: { _id: listing._id, title: listing.title, type: listing.type },
    });
    if (reqDoc.requester.email) {
      sendEmail({
        to: reqDoc.requester.email,
        subject: 'A listing matches your wishlist request',
        text: `"${listing.title}" was just listed and may match your request "${reqDoc.title}".`,
      });
    }
  }
}

// GET /api/listings?lat=&lng=&radius=&category=&type=&semester=&search=&sort=
async function getListings(req, res, next) {
  try {
    const {
      lat, lng, radius, category, type, semester, department, condition,
      search, sort, page = 1, limit = 20,
    } = req.query;

    const filter = { status: 'active' };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (semester) filter.semester = semester;
    if (department) filter.department = department;
    if (condition) filter.condition = condition;

    let query;

    if (lat && lng) {
      const radiusKm = radius ? Number(radius) : DEFAULT_RADIUS_KM;
      
      // If user wants to sort by newest or price, we must use $geoWithin (MongoDB doesn't allow $near with another sort)
      if (sort === 'newest' || sort === 'price_low') {
        filter.location = {
          $geoWithin: {
            $centerSphere: [[Number(lng), Number(lat)], radiusKm / 6378.1]
          }
        };
      } else {
        // Default to nearest
        filter.location = {
          $near: {
            $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            $maxDistance: radiusKm * 1000,
          },
        };
      }
    }

    if (search) {
      filter.$text = { $search: search };
    }

    query = Listing.find(filter);

    if (sort === 'price_low') query = query.sort({ price: 1 });
    else if (sort === 'newest') query = query.sort({ createdAt: -1 });

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      query.skip(skip).limit(Number(limit)).populate('owner', 'name rating verification.status'),
      Listing.countDocuments(filter),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
async function getListingById(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'owner',
      'name rating verification.status location.areaLabel'
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
async function updateListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your listing' });
    }

    const allowed = [
      'title', 'category', 'subject', 'department', 'semester', 'condition',
      'description', 'type', 'price', 'originalPriceDeclared', 'quantity', 'status',
    ];
    for (const key of allowed) if (req.body[key] !== undefined) listing[key] = req.body[key];

    await listing.save();
    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not your listing' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings/:id/report
async function reportListing(req, res, next) {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'reason is required' });

    const report = await Report.create({
      reportedBy: req.user._id,
      targetType: 'listing',
      targetId: req.params.id,
      reason,
    });
    res.status(201).json({ message: 'Report submitted', report });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createListing, getListings, getListingById, updateListing, deleteListing, reportListing,
};
