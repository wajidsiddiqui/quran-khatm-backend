import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";
import { sendEmail } from "../utils/sendEmail.js";

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  return emailRegex.test(email);
}

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(
      400,
      "Name, email, and password are all required."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!validateEmail(normalizedEmail)) {
    throw new ApiError(
      400,
      "Please enter a valid email address."
    );
  }

  if (password.length < 8) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters."
    );
  }

  const existing = await User.findOne({
    email: normalizedEmail,
  });

  if (existing) {
    throw new ApiError(
      409,
      "An account with that email already exists."
    );
  }

  // Generate 6-digit OTP
  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // OTP expires in 10 minutes
  const otpExpires = new Date(
    Date.now() + 10 * 60 * 1000
  );

  // Create unverified user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    isEmailVerified: false,
    emailVerificationOTP: otp,
    emailVerificationOTPExpires: otpExpires,
  });

  // Send OTP email
  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your Quran Khatm account",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Assalamu Alaikum ${user.name} 🤲</h2>

        <p>Welcome to Quran Khatm.</p>

        <p>Please use the following verification code:</p>

        <h1 style="
          letter-spacing: 6px;
          font-size: 32px;
          color: #047857;
        ">
          ${otp}
        </h1>

        <p>This verification code will expire in 10 minutes.</p>

        <p>If you did not create this account, please ignore this email.</p>
      </div>
    `,
  });

  res.status(201).json({
    success: true,
    message: "Verification code sent to your email.",
    data: {
      userId: user._id,
      email: user.email,
    },
  });
});


// POST /api/auth/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(
      400,
      "Email and verification code are required."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!validateEmail(normalizedEmail)) {
    throw new ApiError(
      400,
      "Please enter a valid email address."
    );
  }

  // Get OTP fields explicitly because select: false
  const user = await User.findOne({
    email: normalizedEmail,
  }).select(
    "+emailVerificationOTP +emailVerificationOTPExpires"
  );

  if (!user) {
    throw new ApiError(
      404,
      "User not found."
    );
  }

  if (user.isEmailVerified) {
    throw new ApiError(
      400,
      "Email is already verified."
    );
  }

  if (
    !user.emailVerificationOTP ||
    !user.emailVerificationOTPExpires
  ) {
    throw new ApiError(
      400,
      "No verification code found. Please sign up again."
    );
  }

  // Check OTP
  if (user.emailVerificationOTP !== otp.toString()) {
    throw new ApiError(
      400,
      "Invalid verification code."
    );
  }

  // Check OTP expiry
  if (user.emailVerificationOTPExpires < new Date()) {
    throw new ApiError(
      400,
      "Verification code has expired. Please sign up again."
    );
  }

  // Mark email as verified
  user.isEmailVerified = true;

  // Remove OTP after successful verification
  user.emailVerificationOTP = null;
  user.emailVerificationOTPExpires = null;

  await user.save();

  // Generate JWT token after successful verification
  const token = signToken(user._id.toString());

  res.status(200).json({
    success: true,
    message: "Email verified successfully.",
    data: {
      user: user.toPublicJSON(),
      token,
    },
  });
});


// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(
      400,
      "Email and password are required."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!validateEmail(normalizedEmail)) {
    throw new ApiError(
      400,
      "Please enter a valid email address."
    );
  }

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(
      401,
      "Invalid email or password."
    );
  }

  // Don't allow login before email verification
  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      "Please verify your email before logging in."
    );
  }

  const token = signToken(user._id.toString());

  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
      token,
    },
  });
});


// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
    },
  });
});