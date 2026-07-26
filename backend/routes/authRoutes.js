const express = require('express');
const router = express.Router();
const { signup, login, refresh } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

const upload = require('../middleware/upload');

router.post('/signup', authLimiter, upload.single('document'), signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);

module.exports = router;
