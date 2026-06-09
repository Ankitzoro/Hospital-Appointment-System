const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new patient or doctor
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, role, phone, specialization, dateOfBirth } = req.body;
    const gender = req.body.gender || undefined;

    // Check required fields
    if (!username || !password || !name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, password, name, email, and role.',
      });
    }

    // Validate role
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either 'patient' or 'doctor'.",
      });
    }

    // Doctor must have specialization
    if (role === 'doctor' && !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Doctors must provide their specialization.',
      });
    }

    // Check if username or email already exists
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: existing.username === username
          ? 'Username already taken.'
          : 'Email already registered.',
      });
    }

    const user = await User.create({
      username,
      password,
      name,
      email,
      role,
      phone,
      specialization,
      dateOfBirth,
      gender,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully.`,
      token,
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user (patient or doctor)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password.',
      });
    }

    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    const token = generateToken(user._id);

    // Remove password from response
    const userObj = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;