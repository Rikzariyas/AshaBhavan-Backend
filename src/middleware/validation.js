import Joi from "joi";

// Validation middleware wrapper
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Replace req with validated values
    Object.assign(req, value);
    next();
  };
};

// Login validation schema
export const validateLogin = validate(
  Joi.object({
    body: Joi.object({
      username: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
          "string.empty": "Username is required",
          "string.min": "Username must be at least 3 characters",
          "string.max": "Username must be less than 50 characters",
          "string.pattern.base":
            "Username can only contain letters, numbers, and underscores",
        }),
      password: Joi.string().min(6).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters",
      }),
    }),
  })
);

// Gallery query validation schema
export const validateGalleryQuery = validate(
  Joi.object({
    query: Joi.object({
      category: Joi.string()
        .valid("studentWork", "programs", "photos", "videos")
        .optional()
        .messages({
          "any.only":
            "Invalid category. Must be studentWork, programs, photos, or videos",
        }),
      page: Joi.number().integer().min(1).default(1).optional(),
      limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    }),
  })
);

// Gallery upload validation schema
// Note: Only images can be uploaded (studentWork, programs, photos)
// Videos cannot be uploaded - they must be added via PATCH /api/gallery/:id with URL
// Note: When using multer, form-data fields come as strings
export const validateGalleryUpload = validate(
  Joi.object({
    body: Joi.object({
      category: Joi.string()
        .valid("studentWork", "programs", "photos")
        .required()
        .messages({
          "any.only":
            "Category must be studentWork, programs, or photos. Videos cannot be uploaded - use PATCH /api/gallery/:id with URL instead",
          "any.required": "Category is required",
          "string.empty": "Category is required",
        }),
      title: Joi.string().trim().max(200).allow(null, "").optional(),
    }),
  })
);

// Gallery ID validation schema
export const validateGalleryId = validate(
  Joi.object({
    params: Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          "string.pattern.base": "Invalid gallery ID format",
          "any.required": "Gallery ID is required",
        }),
    }),
  })
);

// Gallery item update validation schema (for PATCH - all fields optional)
export const validateGalleryItemUpdate = validate(
  Joi.object({
    params: Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          "string.pattern.base": "Invalid gallery ID format",
          "any.required": "Gallery ID is required",
        }),
    }),
    body: Joi.object({
      url: Joi.string().uri().optional().messages({
        "string.uri": "Invalid URL format",
      }),
      title: Joi.string().trim().max(200).allow(null, "").optional(),
      category: Joi.string()
        .valid("studentWork", "programs", "photos")
        .optional()
        .messages({
          "any.only":
            "Invalid category. Must be studentWork, programs, or photos",
        }),
    })
      .min(1)
      .messages({
        "object.min": "At least one field must be provided for update",
      }),
  })
);

// Student creation validation schema
export const validateStudentCreate = validate(
  Joi.object({
    body: Joi.object({
      name: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .required()
        .messages({
          "string.empty": "Name is required",
          "string.min": "Name cannot be empty",
          "string.max": "Name cannot exceed 200 characters",
          "any.required": "Name is required",
        }),
      dob: Joi.date()
        .iso()
        .max("now")
        .required()
        .messages({
          "date.base": "Date of birth must be a valid date",
          "date.format": "Date of birth must be in ISO format (YYYY-MM-DD)",
          "date.max": "Date of birth cannot be in the future",
          "any.required": "Date of birth is required",
        }),
      joiningDate: Joi.date()
        .iso()
        .max("now")
        .required()
        .messages({
          "date.base": "Joining date must be a valid date",
          "date.format": "Joining date must be in ISO format (YYYY-MM-DD)",
          "date.max": "Joining date cannot be in the future",
          "any.required": "Joining date is required",
        }),
      // Note: avatar is handled as a file upload via multer, not in body
    }),
  })
);

// Student update validation schema (for PUT/PATCH - all fields optional)
// Custom validation to allow avatar-only updates via file upload
export const validateStudentUpdate = (req, res, next) => {
  // First validate params
  const paramsSchema = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid student ID format",
        "any.required": "Student ID is required",
      }),
  });

  const paramsResult = paramsSchema.validate(req.params);
  if (paramsResult.error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: paramsResult.error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  // Check if at least one field is provided (body fields OR file)
  const hasBodyFields =
    req.body && Object.keys(req.body).length > 0 && Object.values(req.body).some((v) => v !== undefined && v !== null && v !== "");
  const hasFile = req.file !== undefined;

  if (!hasBodyFields && !hasFile) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [
        {
          field: "body",
          message:
            "At least one field must be provided for update (name, dob, joiningDate, or avatar file)",
        },
      ],
    });
  }

  // Validate body fields if they exist
  if (hasBodyFields) {
    const bodySchema = Joi.object({
      name: Joi.string().trim().min(1).max(200).optional().messages({
        "string.min": "Name cannot be empty",
        "string.max": "Name cannot exceed 200 characters",
      }),
      dob: Joi.date().iso().max("now").optional().messages({
        "date.base": "Date of birth must be a valid date",
        "date.format": "Date of birth must be in ISO format (YYYY-MM-DD)",
        "date.max": "Date of birth cannot be in the future",
      }),
      joiningDate: Joi.date().iso().max("now").optional().messages({
        "date.base": "Joining date must be a valid date",
        "date.format": "Joining date must be in ISO format (YYYY-MM-DD)",
        "date.max": "Joining date cannot be in the future",
      }),
    });

    const bodyResult = bodySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (bodyResult.error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: bodyResult.error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    // Replace req.body with validated values
    Object.assign(req.body, bodyResult.value);
  }

  next();
};

// Student ID validation schema
export const validateStudentId = validate(
  Joi.object({
    params: Joi.object({
      id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          "string.pattern.base": "Invalid student ID format",
          "any.required": "Student ID is required",
        }),
    }),
  })
);

// Student query validation schema (for filtering by year)
export const validateStudentQuery = validate(
  Joi.object({
    query: Joi.object({
      year: Joi.number()
        .integer()
        .min(1900)
        .max(2100)
        .optional()
        .messages({
          "number.base": "Year must be a number",
          "number.integer": "Year must be an integer",
          "number.min": "Year must be at least 1900",
          "number.max": "Year must be at most 2100",
        }),
    }),
  })
);
