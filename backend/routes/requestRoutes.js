const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createRequest, getMyRequests, getRequestMatches } = require('../controllers/requestController');

router.post('/', requireAuth, createRequest);
router.get('/mine', requireAuth, getMyRequests);
router.get('/matches/:id', requireAuth, getRequestMatches);

module.exports = router;
