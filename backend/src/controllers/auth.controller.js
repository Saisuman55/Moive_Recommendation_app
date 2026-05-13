import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "30d",
  });
};

// Register new user
export const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json(
    sendSuccess(res, 201, {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    })
  );
});

// Login user
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(200).json(
    sendSuccess(res, 200, {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    })
  );
});

// Get current user
export const getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.userId)
    .populate("watchlist", "title posterUrl rating")
    .populate("likedMovies", "title posterUrl rating");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sendSuccess(res, 200, user);
});

// Refresh token
export const refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const token = generateToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  return sendSuccess(res, 200, { token, refreshToken: newRefreshToken });
});

export default {
  register,
  login,
  getCurrentUser,
  refreshToken,
};