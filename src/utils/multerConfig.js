import multer from "multer";
import path from "path"; // Still needed for fileFilter

// Use memory storage for Cloudinary (uploads to memory buffer)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Only image files are allowed (jpeg, jpg, png). Invalid file type."
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

// Helper to get file URL (kept for backward compatibility, but Cloudinary URLs are returned directly)
export const getFileUrl = (filename) => {
  if (!filename) return null;
  // In production, you would use your actual domain/CDN URL
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  return `${baseUrl}/uploads/gallery/${filename}`;
};
