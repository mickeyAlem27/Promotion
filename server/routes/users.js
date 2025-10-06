const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUsers, searchUsers, getUserById } = require('../controllers/userController');

// Protect all routes with authentication middleware
router.use(protect);

// Get all users (except current user)
router.get('/', getUsers);

// Search users by name or role
router.get('/search', searchUsers);

// Get single user by id
router.get('/:userId', getUserById);

module.exports = router;
