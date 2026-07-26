const express = require('express');
const router = express.Router();
const { signup, login, refresh } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);

module.exports = router;
