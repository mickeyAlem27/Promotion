const User = require('../models/User');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
// @desc    Get all users (except current user)
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        error: 'Database not available. User management requires database connection.',
        mongodb_status: 'disconnected'
      });
    }

    // Get all users without excluding current user
    const users = await User.find({})
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .sort({ firstName: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search users by name or role
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // If no authenticated user, return all matching users
    const searchQuery = req.user && req.user.id
      ? {
          $and: [
            { _id: { $ne: req.user.id } },
            {
              $or: [
                { firstName: { $regex: q, $options: 'i' } },
                { lastName: { $regex: q, $options: 'i' } },
                { role: { $regex: q, $options: 'i' } }
              ]
            }
          ]
        }
      : {
          $or: [
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { role: { $regex: q, $options: 'i' } }
          ]
        };

    const users = await User.find(searchQuery)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = {
  getUsers,
  searchUsers,
  // Get single user by id
  getUserById: asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user by id:', error);
      res.status(500).json({ message: 'Server error' });
    }
  })
};
