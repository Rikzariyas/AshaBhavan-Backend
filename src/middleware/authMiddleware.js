import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.js";

// Protect routes - Only admins can access protected routes
// Public users don't need authentication to view content
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          message: "Token has been revoked. Please login again.",
        });
      }

      // Verify token
      const decoded = verifyToken(token);

      // Get admin from token (User collection only contains admins)
      const admin = await User.findById(decoded.id).select("-password");

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin not found",
        });
      }

      req.user = admin;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
        error: error.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Admin only middleware - ensures user is admin
// Note: Since only admins exist in User collection, this is mostly redundant
// but kept for explicit security checks
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }
};
