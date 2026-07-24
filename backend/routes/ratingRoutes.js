const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createRating, getUserRatings, respondToRating } = require('../controllers/ratingController');

router.post('/', requireAuth, createRating);
router.get('/user/:id', getUserRatings);
router.patch('/:id/respond', requireAuth, respondToRating);

module.exports = router;
