const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { reviewVerification } = require('../controllers/verifyController');
const {
  getPendingVerifications, getReports, updateReport, suspendUser, getAuditLog, getStats, listUsers,
} = require('../controllers/adminController');
const { createMeetupPoint } = require('../controllers/meetupController');

router.use(requireAuth, requireRole('admin'));

router.get('/verifications/pending', getPendingVerifications);
router.patch('/verify/:userId', reviewVerification);

router.get('/reports', getReports);
router.patch('/reports/:id', updateReport);

router.get('/users', listUsers);
router.patch('/users/:id/suspend', suspendUser);

router.get('/audit-log', getAuditLog);
router.get('/stats', getStats);

router.post('/meetup-points', createMeetupPoint);

module.exports = router;
