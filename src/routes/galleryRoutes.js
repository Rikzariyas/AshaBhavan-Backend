import express from "express";
import {
  getGallery,
  uploadGalleryImage,
  updateGalleryItem,
  deleteGalleryItem,
} from "../controllers/galleryController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { upload } from "../utils/multerConfig.js";
import {
  validateGalleryQuery,
  validateGalleryUpload,
  validateGalleryId,
  validateGalleryItemUpdate,
} from "../middleware/validation.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/", validateGalleryQuery, getGallery);
router.post(
  "/upload",
  protect,
  adminOnly,
  uploadLimiter,
  upload.single("image"),
  validateGalleryUpload,
  uploadGalleryImage
);
router.patch(
  "/:id",
  protect,
  adminOnly,
  validateGalleryItemUpdate,
  updateGalleryItem
);
router.delete("/:id", protect, adminOnly, validateGalleryId, deleteGalleryItem);

export default router;
