# AshaBhavan Backend API

Production-scale REST API backend for AshaBhavan project with Gallery management and Authentication.

## Features

- 🔐 JWT-based authentication (Admin only - public users don't need accounts)
- 📸 Gallery management (student work, programs, photos, videos)
- 📤 Image upload with Multer (Admin only)
- 🔒 Admin-only protected routes for content management
- 🌐 Public access to view gallery (no authentication required)
- 📄 Pagination support
- 🛡️ Security middleware (Helmet, CORS)
- 📝 Request logging (Morgan)
- ✅ Error handling middleware

## Authentication Model

- **Admin Users**: Only admins exist in the database. They can login/logout and manage content (upload, edit, delete)
- **Public Users**: No accounts needed. Anyone can view gallery content without authentication
- **Protected Routes**: Only admin can access POST, PUT, DELETE endpoints
- **Public Routes**: GET endpoints are accessible to everyone

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication with token blacklisting
- **Joi** for input validation
- **Multer** for file uploads
- **bcryptjs** for password hashing

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Rikzariyas/AshaBhavan-Backend.git
cd AshaBhavan-Backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017
DATABASE=ashabhavan

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=1d

# Admin User Configuration (for seeding)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password-change-this
```

4. Seed the admin user:

```bash
npm run seed:admin
```

**Important Security Notes:**

- Set `ADMIN_PASSWORD` in your `.env` file before seeding
- Never commit `.env` file to version control
- Change the default password after first login in production
- Use strong passwords (minimum 12 characters, mix of letters, numbers, symbols)

5. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication (Admin Only)

**Note**: Only admins can login. Public users don't need accounts to view gallery content.

#### Login (Admin Only)

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-admin-password"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "admin_id",
      "username": "admin",
      "role": "admin"
    }
  }
}
```

#### Logout (Admin Only)

```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Note**: The token is blacklisted upon logout and cannot be used again. Admin must login again to get a new token.

### Gallery

#### Get Gallery Items (Public - No Authentication Required)

```
GET /api/gallery?category=studentWork&page=1&limit=20
```

**Note**: This endpoint is public. Anyone can view gallery items without authentication.

**Query Parameters:**

- `category` (optional): Filter by category (studentWork, programs, photos, videos)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "studentWork": [
      {
        "id": "item_id_1",
        "url": "https://example.com/work1.jpg",
        "title": "Student Artwork",
        "category": "studentWork",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "programs": [],
    "photos": [],
    "videos": [
      {
        "id": "video_id_1",
        "title": "Annual Day",
        "url": "https://www.youtube.com/embed/...",
        "thumbnail": "https://example.com/thumbnail.jpg",
        "category": "programs",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### Update Gallery (Admin Only - Requires Authentication)

```
PUT /api/gallery
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentWork": [
    {
      "url": "https://example.com/new-work.jpg",
      "title": "New Student Work"
    }
  ],
  "programs": [],
  "photos": [],
  "videos": [
    {
      "title": "New Video",
      "url": "https://www.youtube.com/embed/...",
      "thumbnail": "https://example.com/thumbnail.jpg"
    }
  ]
}

Note: Videos can only be added via this endpoint with URLs.
Videos cannot be uploaded - use POST /api/gallery/upload only for images.
```

#### Upload Gallery Image (Admin Only - Requires Authentication)

```
POST /api/gallery/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- image: File (image file only - jpeg, jpg, png, gif, webp)
- category: String (studentWork, programs, photos only - videos cannot be uploaded)
- title: String (optional)

Note: Only images can be uploaded. Videos must be added via PUT /api/gallery with URL.
```

**Response:**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "id": "new_image_id",
    "url": "http://localhost:3000/uploads/gallery/image-1234567890.jpg",
    "category": "studentWork",
    "title": "Uploaded Image"
  }
}
```

#### Delete Gallery Item (Admin Only - Requires Authentication)

```
DELETE /api/gallery/:id
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Gallery item deleted successfully"
}
```

## Project Structure

```
AshaBhavan-Backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   └── galleryController.js # Gallery CRUD operations
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT authentication & authorization
│   │   └── errorMiddleware.js # Error handling
│   ├── models/
│   │   ├── User.js            # User/Admin model
│   │   └── Gallery.js         # Gallery item model
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   └── galleryRoutes.js   # Gallery endpoints
│   └── utils/
│       ├── jwt.js             # JWT utilities
│       ├── multerConfig.js    # File upload configuration
│       └── seedAdmin.js       # Admin user seeder
├── uploads/
│   └── gallery/               # Uploaded images storage
├── server.js                   # Main server file
├── package.json
└── README.md
```

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Admin-only route protection
- Helmet.js for security headers
- CORS configuration
- File upload validation
- Input validation

## Error Handling

All errors are handled by the error middleware and return consistent JSON responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details (development only)"
}
```

## File Uploads

- **Images Only**: Only image files can be uploaded (JPEG, JPG, PNG, GIF, WEBP)
- **Videos**: Videos cannot be uploaded. They must be added via PUT /api/gallery with URLs (e.g., YouTube embed URLs)
- Maximum file size: 10MB
- Files are stored in `uploads/gallery/` directory
- Files are accessible via `/uploads/gallery/<filename>`

## Environment Variables

| Variable     | Description               | Default               |
| ------------ | ------------------------- | --------------------- |
| `PORT`       | Server port               | 3000                  |
| `NODE_ENV`   | Environment mode          | development           |
| `BASE_URL`   | Base URL for file URLs    | http://localhost:3000 |
| `MONGO_URI`  | MongoDB connection string | -                     |
| `DATABASE`   | Database name             | ashabhavan            |
| `JWT_SECRET` | JWT secret key            | -                     |
| `JWT_EXPIRE` | JWT expiration time       | 1d                    |

## License

ISC
