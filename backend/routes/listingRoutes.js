const express = require('express');
const router = express.Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireVerified } = require('../middleware/roleCheck');
const { listingCreateLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const {
  createListing, getListings, getListingById, updateListing, deleteListing, reportListing,
} = require('../controllers/listingController');

router.post(
  '/',
  requireAuth,
  requireVerified,
  listingCreateLimiter,
  upload.array('photos', 6),
  createListing
);
router.get('/', optionalAuth, getListings);
router.get('/:id', optionalAuth, getListingById);
router.patch('/:id', requireAuth, updateListing);
router.delete('/:id', requireAuth, deleteListing);
router.post('/:id/report', requireAuth, reportListing);

module.exports = router;
