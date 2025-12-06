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
