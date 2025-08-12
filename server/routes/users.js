const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUsers, searchUsers } = require('../controllers/userController');

// Protect all routes with authentication middleware
router.use(protect);

// Get all users (except current user)
router.get('/', getUsers);

// Search users by name or role
router.get('/search', searchUsers);

module.exports = router;
