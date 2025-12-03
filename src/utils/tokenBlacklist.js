import BlacklistedToken from "../models/BlacklistedToken.js";
import jwt from "jsonwebtoken";

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 * @returns {Promise<void>}
 */
export const blacklistToken = async (token) => {
  try {
    // Decode token without verification to get expiration time
    // This works even if token is expired
    const decoded = jwt.decode(token);
    
    let expiresAt;
    if (decoded && decoded.exp) {
      // Use token's expiration time
      expiresAt = new Date(decoded.exp * 1000);
    } else {
      // If no expiration, use default (24 hours from now)
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    // Add to blacklist (ignore duplicate key errors)
    try {
      await BlacklistedToken.create({
        token,
        expiresAt,
      });
    } catch (error) {
      // If token already exists in blacklist, that's fine
      if (error.code !== 11000) {
        throw error;
      }
    }
  } catch (error) {
    // If decoding fails, still try to blacklist with default expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    try {
      await BlacklistedToken.create({
        token,
        expiresAt,
      });
    } catch (createError) {
      // Ignore duplicate key errors
      if (createError.code !== 11000) {
        throw createError;
      }
    }
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {Promise<boolean>} - true if blacklisted, false otherwise
 */
export const isTokenBlacklisted = async (token) => {
  const blacklisted = await BlacklistedToken.findOne({ token });
  return !!blacklisted;
};

