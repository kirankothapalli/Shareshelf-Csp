const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getUserProfile, updateMe, updateMyLocation, reportUser } = require('../controllers/userController');

router.get('/:id', getUserProfile);
router.patch('/me', requireAuth, updateMe);
router.patch('/me/location', requireAuth, updateMyLocation);
router.post('/:id/report', requireAuth, reportUser);

module.exports = router;
