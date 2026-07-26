const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createRequest, getAllOpenRequests, getMyRequests, getRequestMatches } = require('../controllers/requestController');

router.get('/', getAllOpenRequests); // public — community requests board
router.post('/', requireAuth, createRequest);
router.get('/mine', requireAuth, getMyRequests);
router.get('/matches/:id', requireAuth, getRequestMatches);

module.exports = router;

