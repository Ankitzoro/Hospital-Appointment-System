const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationOtpEmail } = require('../utils/mailer');
const { protect } = require('../middleware/auth');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const sendVerificationOtpEmailInBackground = ({ to, name, otp }) => {
  sendVerificationOtpEmail({ to, name, otp }).catch((error) => {
    console.error(`Failed to send verification email to ${to}:`, error);
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

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if username or email already exists
    const existing = await User.findOne({ $or: [{ username }, { email: normalizedEmail }] });
    if (existing) {
      if (existing.email === normalizedEmail && !existing.isEmailVerified) {
        const otp = generateOtp();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        existing.setEmailVerificationOtp(otp, otpExpiresAt);
        await existing.save();

        sendVerificationOtpEmailInBackground({
          to: existing.email,
          name: existing.name,
          otp,
        });

        return res.status(200).json({
          success: true,
          message: 'Account already exists but is not verified. A new verification code is being sent to your email.',
          verificationRequired: true,
          email: existing.email,
        });
      }

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
      email: normalizedEmail,
      role,
      phone,
      specialization,
      dateOfBirth,
      gender,
      isEmailVerified: false,
    });

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.setEmailVerificationOtp(otp, otpExpiresAt);
    await user.save();

    sendVerificationOtpEmailInBackground({
      to: user.email,
      name: user.name,
      otp,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your verification code is being sent to your email.',
      verificationRequired: true,
      email: user.email,
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

// @route   POST /api/auth/verify-email
// @desc    Verify email using OTP
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP.',
      });
    }

    const user = await User.findOne({ email }).select('+emailVerificationOtpHash +emailVerificationOtpExpiresAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
      });
    }

    if (!user.verifyEmailOtp(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    user.clearEmailVerificationOtp();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/resend-verification-otp
// @desc    Resend verification OTP
// @access  Public
router.post('/resend-verification-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email.',
      });
    }

    const user = await User.findOne({ email }).select('+emailVerificationOtpHash +emailVerificationOtpExpiresAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified.',
      });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.setEmailVerificationOtp(otp, otpExpiresAt);
    await user.save();

    sendVerificationOtpEmailInBackground({
      to: user.email,
      name: user.name,
      otp,
    });

    res.status(200).json({
      success: true,
      message: 'A new verification code is being sent to your email.',
    });
  } catch (error) {
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        verificationRequired: true,
        email: user.email,
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
