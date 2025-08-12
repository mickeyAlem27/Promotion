const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Get all users (except current user)
// @route   GET /api/users
// @access  Private
const getUsers = asyncHandler(async (req, res) => {
  try {
    // Exclude the current user and select only necessary fields
    const users = await User.find({ _id: { $ne: req.user.id } })
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

    const users = await User.find({
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
    }).select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = {
  getUsers,
  searchUsers
};
