import Gallery from "../models/Gallery.js";
import { getFileUrl } from "../utils/multerConfig.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Get all gallery items
// @route   GET /api/gallery
// @access  Public (No authentication required - anyone can view)
export const getGallery = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    // Build query
    const query = category ? { category } : {};

    // Calculate pagination (already validated by middleware)
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Gallery.countDocuments(query);

    // Get gallery items
    const galleryItems = await Gallery.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Group by category
    const grouped = {
      studentWork: [],
      programs: [],
      photos: [],
      videos: [],
    };

    galleryItems.forEach((item) => {
      const formattedItem = {
        id: item._id.toString(),
        url: item.url,
        title: item.title || null,
        category: item.category,
        createdAt: item.createdAt,
      };

      if (item.category === "videos" && item.thumbnail) {
        formattedItem.thumbnail = item.thumbnail;
      }

      grouped[item.category].push(formattedItem);
    });

    // If category filter is applied, only return that category
    const data = category ? { [category]: grouped[category] } : grouped;

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gallery items
// @route   PUT /api/gallery
// @access  Private/Admin only
export const updateGallery = async (req, res, next) => {
  try {
    const { studentWork, programs, photos, videos } = req.body;

    const allItems = [
      ...(studentWork || []).map((item) => ({
        ...item,
        category: "studentWork",
      })),
      ...(programs || []).map((item) => ({ ...item, category: "programs" })),
      ...(photos || []).map((item) => ({ ...item, category: "photos" })),
      ...(videos || []).map((item) => ({ ...item, category: "videos" })),
    ];

    // Delete all existing items
    await Gallery.deleteMany({});

    // Insert new items
    const insertedItems = await Gallery.insertMany(allItems);

    // Format response
    const grouped = {
      studentWork: [],
      programs: [],
      photos: [],
      videos: [],
    };

    insertedItems.forEach((item) => {
      const formattedItem = {
        id: item._id.toString(),
        url: item.url,
        title: item.title || null,
        category: item.category,
        createdAt: item.createdAt,
      };

      if (item.category === "videos" && item.thumbnail) {
        formattedItem.thumbnail = item.thumbnail;
      }

      grouped[item.category].push(formattedItem);
    });

    res.status(200).json({
      success: true,
      message: "Gallery updated successfully",
      data: grouped,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload gallery image (images only - videos cannot be uploaded)
// @route   POST /api/gallery/upload
// @access  Private/Admin only
// @note    Only images can be uploaded. Videos must be added via PUT /api/gallery with URL
export const uploadGalleryImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Validation is handled by Joi middleware
    // req.body is already validated and sanitized
    const { category, title } = req.body;

    // Get file URL
    const fileUrl = getFileUrl(req.file.filename);

    // Create gallery item
    const galleryItem = await Gallery.create({
      url: fileUrl,
      title: title || null,
      category,
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        id: galleryItem._id.toString(),
        url: galleryItem.url,
        category: galleryItem.category,
        title: galleryItem.title || null,
      },
    });
  } catch (error) {
    // Delete uploaded file if error occurs
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        // Log error but don't fail the request
        console.error("Error deleting file:", unlinkError.message);
      }
    }
    next(error);
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private/Admin only
export const deleteGalleryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const galleryItem = await Gallery.findById(id);

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // If it's a local file, delete it from filesystem
    if (galleryItem.url.includes("/uploads/gallery/")) {
      const filename = galleryItem.url.split("/uploads/gallery/")[1];
      const filePath = path.join(__dirname, "../../uploads/gallery", filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        // Log error but don't fail the request
        console.error("Error deleting file:", fileError.message);
      }
    }

    await Gallery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
