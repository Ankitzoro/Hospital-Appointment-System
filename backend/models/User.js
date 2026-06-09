const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['patient', 'doctor'],
      required: [true, 'Role is required'],
    },
    phone: {
      type: String,
      trim: true,
    },
    // Doctor-specific fields
    specialization: {
      type: String,
      trim: true,
    },
    // Patient-specific fields
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOtpHash: {
      type: String,
      select: false,
    },
    emailVerificationOtpExpiresAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.setEmailVerificationOtp = function (otp, expiresAt) {
  const crypto = require('crypto');
  this.emailVerificationOtpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  this.emailVerificationOtpExpiresAt = expiresAt;
};

userSchema.methods.verifyEmailOtp = function (otp) {
  const crypto = require('crypto');
  if (!this.emailVerificationOtpHash || !this.emailVerificationOtpExpiresAt) {
    return false;
  }

  if (this.emailVerificationOtpExpiresAt.getTime() < Date.now()) {
    return false;
  }

  const candidateHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
  return candidateHash === this.emailVerificationOtpHash;
};

userSchema.methods.clearEmailVerificationOtp = function () {
  this.emailVerificationOtpHash = undefined;
  this.emailVerificationOtpExpiresAt = undefined;
  this.isEmailVerified = true;
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationOtpHash;
  delete obj.emailVerificationOtpExpiresAt;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
