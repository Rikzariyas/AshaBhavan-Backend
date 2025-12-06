import express from "express";
import { login, logout } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateLogin } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", authLimiter, validateLogin, login);
router.post("/logout", protect, logout);

export default router;
