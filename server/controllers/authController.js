const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists with this email', 400));
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'user'
    });

    // Create token
    const token = user.getSignedJwtToken();

    // Set cookie options with default expiration of 30 days
    const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE) || 30; // Default to 30 days if not set
    const expires = new Date();
    expires.setDate(expires.getDate() + cookieExpireDays);
    
    const options = {
      expires: expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    
    console.log('Cookie options:', options);
    console.log('Cookie will expire on:', expires.toISOString());

    res
      .status(201)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  console.log('Login attempt:', { email: req.body.email });
  
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    console.log('Missing email or password');
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('No user found with email:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    console.log('Checking password...');
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Create token
    const token = user.getSignedJwtToken();

    // Set cookie options with default expiration of 30 days
    const cookieExpireDays = Number(process.env.JWT_COOKIE_EXPIRE) || 30; // Default to 30 days if not set
    const expires = new Date();
    expires.setDate(expires.getDate() + cookieExpireDays);
    
    const options = {
      expires: expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    
    console.log('Cookie options:', options);
    console.log('Cookie will expire on:', expires.toISOString());

    res
      .status(200)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};
