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

// All student routes require authentication
router.use(protect);

// POST /api/students - Create a new student (with optional avatar upload)
router.post(
  "/",
  uploadLimiter,
  upload.single("avatar"),
  validateStudentCreate,
  createStudent
);

// GET /api/students - Get all students (with optional year query parameter)
router.get("/", validateStudentQuery, getStudents);

// GET /api/students/:id - Get a single student by ID
router.get("/:id", validateStudentId, getStudentById);

// PUT /api/students/:id - Update a student (with optional avatar upload/replacement)
router.put(
  "/:id",
  uploadLimiter,
  upload.single("avatar"),
  validateStudentUpdate,
  updateStudent
);

// DELETE /api/students/:id - Delete a student
router.delete("/:id", validateStudentId, deleteStudent);

export default router;
