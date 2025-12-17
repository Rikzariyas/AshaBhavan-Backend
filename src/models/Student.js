import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    age: {
      type: Number,
      default: null,
    },
    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
    },
    avatarCloudinaryPublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // This creates createdAt and updatedAt automatically
  }
);

// Calculate age before saving
studentSchema.pre("save", function (next) {
  if (this.dob) {
    const today = new Date();
    const birthDate = new Date(this.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    this.age = age;
  }
  next();
});

// Index for efficient queries by year
studentSchema.index({ joiningDate: 1 });

const Student = mongoose.model("Student", studentSchema);

export default Student;

