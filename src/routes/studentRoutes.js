import express from "express";
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../utils/multerConfig.js";
import {
  validateStudentCreate,
  validateStudentUpdate,
  validateStudentId,
  validateStudentQuery,
} from "../middleware/validation.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// GET /api/students - Get all students (with optional year query parameter) - Public route
router.get("/", validateStudentQuery, getStudents);

// GET /api/students/:id - Get a single student by ID - Public route
router.get("/:id", validateStudentId, getStudentById);

// POST /api/students - Create a new student (with optional avatar upload) - Protected route
router.post(
  "/",
  protect,
  uploadLimiter,
  upload.single("avatar"),
  validateStudentCreate,
  createStudent
);

// PUT /api/students/:id - Update a student (with optional avatar upload/replacement) - Protected route
router.put(
  "/:id",
  protect,
  uploadLimiter,
  upload.single("avatar"),
  validateStudentUpdate,
  updateStudent
);

// DELETE /api/students/:id - Delete a student - Protected route
router.delete("/:id", protect, validateStudentId, deleteStudent);

export default router;
