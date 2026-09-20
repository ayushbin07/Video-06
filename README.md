# VideoTube Backend API

A robust, production-grade RESTful API backend for a video hosting platform (YouTube clone), built using Node.js, Express 5, MongoDB (Mongoose), and Cloudinary. Developed as part of the *Chai aur Code* backend engineering series.

---

## 🚀 Features

- **Authentication & Authorization**:
  - Secure password hashing with `bcrypt`.
  - Dual-token authentication with Access Tokens (short-lived) and Refresh Tokens (long-lived).
  - Refresh token rotation and secure cookie / Bearer token authorization.
- **User & Channel Management**:
  - Registration with multi-asset upload (Avatar and Cover Image).
  - Profile update, password change, and channel statistics.
  - Watch history tracking and channel subscription metrics via MongoDB aggregation pipelines.
- **Media Storage**:
  - Direct file upload handling via `multer` temporary disk storage.
  - Cloud-based media storage and asset management via `cloudinary`.
- **Data Models & Social Features**:
  - Schemas and relationships for Users, Videos, Subscriptions, Comments, Likes, Playlists, and Tweets.
  - Pagination support using `mongoose-aggregate-paginate-v2`.
- **Architecture & Error Handling**:
  - Standardized API response (`ApiResponse`) and API error (`ApiError`) contracts.
  - Higher-order asynchronous route wrapper (`asyncHandler`) for centralized error forwarding.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Runtime Environment** | Node.js (ES Modules) |
| **Framework** | Express.js (v5) |
| **Database & ODM** | MongoDB with Mongoose |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcrypt` |
| **File Upload & Storage** | Multer, Cloudinary SDK |
| **Utilities** | `cookie-parser`, `cors`, `dotenv` |
| **Dev Tools** | `nodemon`, `prettier` |

---

## 📁 Project Structure

```text
Video-06/
├── controllers/          # Business logic and request handlers
│   └── user.controller.js
├── db/                   # MongoDB connection logic
│   └── index.js
├── middlewares/          # Custom Express middlewares
│   ├── auth.middleware.js
│   └── multer.middleware.js
├── models/               # Mongoose schemas and data models
│   ├── comment.model.js
│   ├── like.model.js
│   ├── playlist.model.js
│   ├── subscription.model.js
│   ├── tweet.model.js
│   ├── user.model.js
│   └── video.model.js
├── public/               # Static assets & temporary file uploads
│   └── temp/
├── routes/               # API route definitions
│   └── user.routes.js
├── src/                  # Application entry point & configuration
│   ├── app.js
│   └── index.js
├── utils/                # Helper classes and shared utilities
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   └── cloudinary.js
├── .env.sample           # Sample environment configuration
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- MongoDB instance (Local or MongoDB Atlas)
- Cloudinary Account (for media uploads)

### 1. Clone the repository

```bash
git clone <repository-url>
cd Video-06
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and configure the variables based on `.env.sample`:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_super_secret_access_key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 4. Run the Development Server

```bash
npm run dev
```

The server will initialize MongoDB connection and start listening at: `http://localhost:8000`.

---

## 📡 API Endpoints Reference

Base URL: `/api/v1/users`

| Method | Endpoint | Auth Required | Description |
|---|---|:---:|---|
| `POST` | `/register` | ❌ No | Register new user with avatar & cover image |
| `POST` | `/login` | ❌ No | Authenticate user & issue tokens |
| `POST` | `/refresh-token` | ❌ No | Regenerate access token using refresh token |
| `POST` | `/logout` | ✅ Yes | Revoke refresh token & clear cookies |
| `POST` | `/change-password` | ✅ Yes | Update account password |
| `GET` | `/current-user` | ✅ Yes | Fetch authenticated user details |
| `PATCH` | `/update-account` | ✅ Yes | Update full name and email address |
| `PATCH` | `/avatar` | ✅ Yes | Upload and replace profile avatar |
| `PATCH` | `/cover-image` | ✅ Yes | Upload and replace profile cover image |
| `GET` | `/c/:username` | ✅ Yes | Fetch channel statistics and subscription status |
| `GET` | `/history` | ✅ Yes | Retrieve caller's video watch history |

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
