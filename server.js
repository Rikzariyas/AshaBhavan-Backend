import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import galleryRoutes from "./src/routes/galleryRoutes.js";
import { errorHandler, notFound } from "./src/middleware/errorMiddleware.js";
import { apiLimiter } from "./src/middleware/rateLimiter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Rate limiting
app.use("/api/", apiLimiter);

// Body parser middleware
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Logging middleware
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}else{
  app.use(morgan("combined"));
}

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to database
await connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/gallery", galleryRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `process ID ${
      process.pid
    }: server running on http://localhost:${PORT}/ in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});
