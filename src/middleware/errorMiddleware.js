export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Multer errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum size is 10MB";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE" || err.message?.includes("Unexpected field")) {
      const fieldName = err.field || "unknown";
      message = `Unexpected file field: '${fieldName}'. Please use 'avatar' as the field name for file uploads.`;
    } else {
      message = `File upload error: ${err.message || err.code || "Unknown multer error"}`;
    }
  }

  const errorResponse = {
    success: false,
    message,
  };

  // Include field information for multer errors in development
  if (err.name === "MulterError" && process.env.NODE_ENV !== "production") {
    errorResponse.field = err.field;
    errorResponse.code = err.code;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV !== "production") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
