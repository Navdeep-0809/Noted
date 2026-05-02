// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const { sessionAuth } = require('../middleware/auth');

// Protect activity routes with session authentication
router.use(sessionAuth);

// GET /activity → show activity log
router.get('/', getActivities);

module.exports = router;
