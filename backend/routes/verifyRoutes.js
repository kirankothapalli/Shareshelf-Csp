const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadVerification, getVerificationStatus } = require('../controllers/verifyController');

router.post('/upload', requireAuth, upload.single('document'), uploadVerification);
router.get('/status', requireAuth, getVerificationStatus);

module.exports = router;
