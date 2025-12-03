import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";
import { blacklistToken } from "../utils/tokenBlacklist.js";

// @desc    Login admin (only admins can login, public users don't need accounts)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    // Validation is handled by Joi middleware
    // req.body is already validated and sanitized
    const { username, password } = req.body;

    // Find admin (only admins exist in User collection)
    const admin = await User.findOne({ username: username.toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "Invalid username or password",
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
        error: "Invalid username or password",
      });
    }

    // Generate token
    const token = generateToken(admin._id, admin.username, admin.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: admin._id,
          username: admin.username,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout admin
// @route   POST /api/auth/logout
// @access  Private (Admin only)
export const logout = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token =
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : null;

    if (token) {
      // Blacklist the token
      await blacklistToken(token);
    }

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};
