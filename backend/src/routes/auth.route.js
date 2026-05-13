import { Router } from "express";
import { register, login, getCurrentUser, refreshToken } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/auth/register - Register new user
router.post("/register", register);

// POST /api/auth/login - Login user
router.post("/login", login);

// GET /api/auth/me - Get current user
router.get("/me", protect, getCurrentUser);

// POST /api/auth/refresh-token - Refresh token
router.post("/refresh-token", refreshToken);

export default router;