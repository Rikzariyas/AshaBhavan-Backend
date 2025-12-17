import Student from "../models/Student.js";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

// Helper function to calculate age from date of birth
const calculateAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Helper function to format date to dd/mm/yyyy
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to upload image to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ashabhavan/students/avatars",
        resource_type: "image",
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "limit",
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

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

// @desc    Create a new student
// @route   POST /api/students
// @access  Private (Admin only)
export const createStudent = async (req, res, next) => {
  try {
    // Validation is handled by Joi middleware
    // req.body is already validated and sanitized
    const { name, dob, joiningDate } = req.body;

    let avatarUrl = null;
    let avatarPublicId = null;

    // Upload avatar to Cloudinary if provided
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        avatarUrl = uploadResult.secure_url;
        avatarPublicId = uploadResult.public_id;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: "Failed to upload avatar image",
          error: uploadError.message,
        });
      }
    }

    // Create student
    const student = await Student.create({
      name,
      dob,
      joiningDate,
      avatar: avatarUrl,
      avatarCloudinaryPublicId: avatarPublicId,
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        id: student._id.toString(),
        studentId: student.studentId,
        name: student.name,
        dob: formatDate(student.dob),
        age: student.age,
        joiningDate: formatDate(student.joiningDate),
        avatar: student.avatar,
        createdAt: formatDate(student.createdAt),
        updatedAt: formatDate(student.updatedAt),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students (with optional year filter)
// @route   GET /api/students
// @access  Private (Admin only)
export const getStudents = async (req, res, next) => {
  try {
    const { year } = req.query;

    // Build query
    const query = {};
    if (year) {
      const yearNum = parseInt(year, 10);
      const startDate = new Date(yearNum, 0, 1); // January 1st of the year
      const endDate = new Date(yearNum + 1, 0, 1); // January 1st of next year
      query.joiningDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    // Get all students (no pagination)
    const students = await Student.find(query).sort({ createdAt: -1 }).lean();

    // Format students
    const formattedStudents = students.map((student) => ({
      id: student._id.toString(),
      studentId: student.studentId,
      name: student.name,
      dob: formatDate(student.dob),
      age: student.age,
      joiningDate: formatDate(student.joiningDate),
      avatar: student.avatar,
      createdAt: formatDate(student.createdAt),
      updatedAt: formatDate(student.updatedAt),
    }));

    console.log("formattedStudents>>>>", formattedStudents)

    res.status(200).json({
      success: true,
      data: formattedStudents,
      total: formattedStudents.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single student by ID
// @route   GET /api/students/:id
// @access  Private (Admin only)
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const formattedStudentData ={
      id: student._id.toString(),
      studentId: student.studentId,
      name: student.name,
      dob: formatDate(student.dob),
      age: student.age,
      joiningDate: formatDate(student.joiningDate),
      avatar: student.avatar,
      createdAt: formatDate(student.createdAt),
      updatedAt: formatDate(student.updatedAt),
    }

    console.log("formattedStudentData>>>>", formattedStudentData)

    res.status(200).json({
      success: true,
      data:formattedStudentData ,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private (Admin only)
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the student
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Recalculate age if dob is being updated
    if (updateData.dob) {
      updateData.age = calculateAge(updateData.dob);
    }

    // Handle avatar image replacement if a new file is uploaded
    if (req.file) {
      // Delete old avatar from Cloudinary if it exists
      if (student.avatarCloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(student.avatarCloudinaryPublicId);
        } catch (cloudinaryError) {
          // Log error but don't fail the request
          console.error(
            "Error deleting old Cloudinary avatar:",
            cloudinaryError.message
          );
        }
      }

      // Upload new avatar to Cloudinary
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        updateData.avatar = uploadResult.secure_url;
        updateData.avatarCloudinaryPublicId = uploadResult.public_id;
      } catch (uploadError) {
        return res.status(400).json({
          success: false,
          message: "Failed to upload avatar image",
          error: uploadError.message,
        });
      }
    }

    // Update the student
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: {
        id: updatedStudent._id.toString(),
        studentId: updatedStudent.studentId,
        name: updatedStudent.name,
        dob: formatDate(updatedStudent.dob),
        age: updatedStudent.age,
        joiningDate: formatDate(updatedStudent.joiningDate),
        avatar: updatedStudent.avatar,
        createdAt: formatDate(updatedStudent.createdAt),
        updatedAt: formatDate(updatedStudent.updatedAt),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Delete avatar from Cloudinary if it exists
    if (student.avatarCloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(student.avatarCloudinaryPublicId);
      } catch (cloudinaryError) {
        // Log error but don't fail the request
        console.error(
          "Error deleting Cloudinary avatar:",
          cloudinaryError.message
        );
      }
    }

    // Delete the student
    await Student.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
