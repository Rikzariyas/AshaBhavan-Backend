import mongoose from "mongoose";

const galleryItemSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "URL is required"],
    },
    cloudinaryPublicId: {
      type: String,
      // Not required to support legacy local files
    },
    title: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ["studentWork", "programs", "photos"],
      required: [true, "Category is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
galleryItemSchema.index({ category: 1, createdAt: -1 });

const Gallery = mongoose.model("Gallery", galleryItemSchema);

export default Gallery;
