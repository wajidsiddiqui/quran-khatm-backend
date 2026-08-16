import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { signToken } from "../utils/token.js";

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are all required.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists.");
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id.toString());

  res.status(201).json({ success: true, data: { user: user.toPublicJSON(), token } });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken(user._id.toString());
  res.json({ success: true, data: { user: user.toPublicJSON(), token } });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
});
