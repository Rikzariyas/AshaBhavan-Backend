import Gallery from "../models/Gallery.js";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

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
    };

    galleryItems.forEach((item) => {
      const formattedItem = {
        id: item._id.toString(),
        url: item.url,
        title: item.title || null,
        category: item.category,
        createdAt: item.createdAt,
      };

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

// @route   POST /api/gallery/upload
// @access  Private/Admin only
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

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "ashabhavan/gallery", // Organize images in a folder
          resource_type: "image",
          transformation: [
            {
              quality: "auto",
              fetch_format: "auto",
            },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Convert buffer to stream
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });

    // Create gallery item with Cloudinary URL and public_id
    const galleryItem = await Gallery.create({
      url: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
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
    next(error);
  }
};

// @desc    Update a single gallery item
// @route   PATCH /api/gallery/:id
// @access  Private/Admin only
export const updateGalleryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the gallery item
    const galleryItem = await Gallery.findById(id);

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // If URL is being updated and it's a Cloudinary image, delete the old image from Cloudinary
    if (updateData.url && galleryItem.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(galleryItem.cloudinaryPublicId);
      } catch (cloudinaryError) {
        // Log error but don't fail the request
        console.error("Error deleting old Cloudinary image:", cloudinaryError.message);
      }
    }

    // Update the gallery item
    const updatedItem = await Gallery.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Gallery item updated successfully",
      data: {
        id: updatedItem._id.toString(),
        url: updatedItem.url,
        title: updatedItem.title || null,
        category: updatedItem.category,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt,
      },
    });
  } catch (error) {
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

    // Delete from Cloudinary if it's a Cloudinary image
    if (galleryItem.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(galleryItem.cloudinaryPublicId);
      } catch (cloudinaryError) {
        // Log error but don't fail the request
        console.error("Error deleting Cloudinary image:", cloudinaryError.message);
      }
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
