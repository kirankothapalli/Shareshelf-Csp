const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getMessages, postMessage } = require('../controllers/messageController');

router.get('/:transactionId', requireAuth, getMessages);
router.post('/:transactionId', requireAuth, postMessage);

module.exports = router;
