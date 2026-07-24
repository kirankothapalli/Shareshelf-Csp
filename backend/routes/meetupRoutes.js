const express = require('express');
const router = express.Router();
const { getMeetupPoints } = require('../controllers/meetupController');

router.get('/', getMeetupPoints);

module.exports = router;
