const express = require('express');
const router = express.Router();
const { signup, login, refresh, otpSend, otpVerify } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/otp/send', authLimiter, otpSend);
router.post('/otp/verify', authLimiter, otpVerify);

module.exports = router;
