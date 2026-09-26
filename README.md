# VideoTube Backend API

<p align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="Node.js" width="60" height="60" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original.svg" alt="Express.js" width="60" height="60" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mongodb/mongodb-original.svg" alt="MongoDB" width="60" height="60" />
</p>

<p align="center">
  <strong>A production-grade, modular RESTful API backend for a video hosting and social media platform.</strong><br>
  Built with Node.js, Express 5, MongoDB, Mongoose, and Cloudinary as part of the <em>Chai aur Code</em> backend engineering series.
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <a href="https://mongoosejs.com/"><img src="https://img.shields.io/badge/Mongoose-ODM-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose" /></a>
  <a href="https://jwt.io/"><img src="https://img.shields.io/badge/JWT-Secure_Tokens-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" /></a>
  <a href="https://cloudinary.com/"><img src="https://img.shields.io/badge/Cloudinary-Media_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" /></a>
  <a href="https://www.postman.com/"><img src="https://img.shields.io/badge/Postman-API_Testing-FF6C37?style=for-the-badge&logo=postman&logoColor=white" alt="Postman" /></a>
</p>

---

## 🚀 Features

### 🔐 Authentication & Security
- **Secure Password Hashing**: Encrypted passwords via `bcrypt`.
- **Dual-Token System**: Short-lived Access Tokens (JWT) paired with rotatable Refresh Tokens.
- **Flexible Auth Extraction**: Reads access tokens from either secure HTTP-only cookies or `Authorization: Bearer <token>` headers.

### 👤 User & Channel Management
- **Multi-File Uploads**: Handles avatar and cover image uploads via `Multer` disk storage and pipelines them to `Cloudinary`.
- **Profile Customization**: Update account info (name/email), avatar, cover image, and change password securely.
- **Channel Analytics**: Calculates total subscriber counts, channels subscribed to, and subscription status via MongoDB aggregation pipelines.
- **Watch History**: Tracks and populates complete video viewing history per user.

### 💬 Tweets System
- **CRUD Operations**: Create, read, update, and delete short-form text posts.
- **Pagination**: Paginated user tweet retrieval powered by `mongoose-aggregate-paginate-v2`.
- **Strict Authorization**: Ensures only tweet authors can edit or remove their posts.

### 🔔 Subscription Engine
- **Atomic Toggle**: Clean subscribe/unsubscribe mechanism avoiding race conditions.
- **Optimized Counts & Lists**: Fast subscriber counts via `countDocuments`, channel follower lists, and subscribed channel directory.
- **Status Checking**: Instant lookup of subscription status via `Subscription.exists`.

### 🛡️ Architecture & Resilience
- **Centralized Wrapper**: Asynchronous controller wrapper (`asyncHandler`) guaranteeing rejected promises reach Express error middleware.
- **Uniform API Contracts**: Predictable responses with `ApiResponse` and typed exceptions with `ApiError`.

---

## 🛠️ Tech Stack

| Category | Technology | Logo | Description |
|:---|:---|:---:|:---|
| **Runtime** | Node.js (ES Modules) | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="28" height="28" alt="Node.js" /> | Fast, event-driven server runtime |
| **Framework** | Express.js 5 | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" width="28" height="28" alt="Express" /> | Minimalist web application framework |
| **Database** | MongoDB | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="28" height="28" alt="MongoDB" /> | NoSQL document database |
| **ODM** | Mongoose | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongoose/mongoose-original.svg" width="28" height="28" alt="Mongoose" /> | Schema-based data modeling and validation |
| **Authentication** | JSON Web Tokens | <img src="https://jwt.io/img/pic_logo.svg" width="28" height="28" alt="JWT" /> | Dual token issuance and signature verification |
| **Security** | bcrypt | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" width="28" height="28" alt="bcrypt" /> | Salted password hashing algorithm |
| **File Handling** | Multer | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original.svg" width="28" height="28" alt="Multer" /> | Multipart/form-data upload middleware |
| **Media Cloud** | Cloudinary | <img src="https://cloudinary-res.cloudinary.com/image/upload/website/cloudinary_web_favicon.png" width="28" height="28" alt="Cloudinary" /> | Cloud asset hosting, optimization & CDN |
| **Pagination** | Aggregate Paginate v2 | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="28" height="28" alt="Pagination" /> | Pipeline pagination for high-volume datasets |
| **Tooling** | Nodemon & Prettier | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodemon/nodemon-original.svg" width="28" height="28" alt="Nodemon" /> | Live reloading and automated formatting |

---

## 📁 Project Structure

```text
Video-06/
├── controllers/                  # Business logic & request handlers
│   ├── subscription.controller.js # Subscription toggle, subscriber counts & lists
│   ├── tweet.controller.js       # Tweet CRUD operations & paginated feed
│   └── user.controller.js        # Authentication, account, & channel profiles
├── db/                           # Database connection layer
│   └── index.js                  # Mongoose MongoDB connection initializer
├── middlewares/                  # Express middlewares
│   ├── auth.middleware.js        # JWT verification & req.user injection
│   └── multer.middleware.js      # Local disk storage configuration for uploads
├── models/                       # Mongoose schemas & data models
│   ├── comment.model.js          # Comment schema
│   ├── like.model.js             # Like schema (videos, comments, tweets)
│   ├── playlist.model.js         # User playlist schema
│   ├── subscription.model.js     # Subscriber-Channel junction schema
│   ├── tweet.model.js            # Tweet schema
│   ├── user.model.js             # User profile, credentials & watch history
│   └── video.model.js            # Video schema with aggregate pagination
├── public/                       # Local static files & temporary storage
│   └── temp/                     # Ephemeral upload buffer for Multer
├── routes/                       # Express router modules
│   ├── subscription.route.js     # /api/v1/subscriptions endpoints
│   ├── tweet.route.js            # /api/v1/tweets endpoints
│   └── user.routes.js            # /api/v1/users endpoints
├── src/                          # Server setup & app orchestration
│   ├── app.js                    # Express app configuration & middleware mounts
│   └── index.js                  # Server bootstrap & DB connection trigger
├── utils/                        # Shared utilities & response helpers
│   ├── ApiErrors.js              # Standardized custom ApiError class
│   ├── ApiResponse.js            # Unified JSON response contract class
│   ├── asyncHandler.js           # Higher-order async route handler wrapper
│   └── cloudinary.js             # Cloudinary upload & local file cleanup
├── .env.sample                   # Environment variable template
├── package.json                  # Dependencies & scripts
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas cluster)
- [Cloudinary](https://cloudinary.com/) free developer account

### 1. Clone & Install

```bash
git clone <repository-url>
cd Video-06
npm install
```

### 2. Configure Environment

Copy `.env.sample` to `.env` and fill in your credentials:

```bash
cp .env.sample .env
```

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_super_secret_access_token_key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Run Development Server

```bash
npm run dev
```

The server will connect to MongoDB and start listening on `http://localhost:8000`.

---

## 📡 API Endpoints Reference

### 👤 User Endpoints (`/api/v1/users`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/register` | ❌ No | Register new user with avatar & optional cover image |
| `POST` | `/login` | ❌ No | Authenticate credentials and receive access/refresh tokens |
| `POST` | `/refresh-token` | ❌ No | Renew access token via valid refresh token |
| `POST` | `/logout` | ✅ Yes | Revoke refresh token and clear auth cookies |
| `POST` | `/change-password` | ✅ Yes | Change current account password |
| `GET` | `/current-user` | ✅ Yes | Retrieve profile details of authenticated user |
| `PATCH` | `/update-account` | ✅ Yes | Update full name and email |
| `PATCH` | `/avatar` | ✅ Yes | Update profile avatar (multipart/form-data) |
| `PATCH` | `/cover-image` | ✅ Yes | Update channel cover image (multipart/form-data) |
| `GET` | `/c/:username` | ✅ Yes | Get public channel statistics and subscriber metrics |
| `GET` | `/history` | ✅ Yes | Fetch user's watched video history |

---

### 💬 Tweet Endpoints (`/api/v1/tweets`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/create-tweet` | ✅ Yes | Create and publish a new tweet |
| `GET` | `/get-user-tweets/:userId` | ✅ Yes | Fetch paginated tweets authored by a specific user |
| `PATCH` | `/update-tweet/:tweetId` | ✅ Yes | Edit content of an existing tweet (owner only) |
| `DELETE` | `/delete-tweet/:tweetId` | ✅ Yes | Permanently remove a tweet (owner only) |

---

### 🔔 Subscription Endpoints (`/api/v1/subscriptions`)

| Method | Endpoint | Auth | Description |
|:---:|:---|:---:|:---|
| `POST` | `/toogle-subscription/:channelId` | ✅ Yes | Toggle subscription to a channel (subscribe / unsubscribe) |
| `GET` | `/count-subscriber/:channelId` | ✅ Yes | Get total number of subscribers for a channel |
| `GET` | `/get-subscribers/:channelId` | ✅ Yes | Get detailed list of all subscribers for a channel |
| `GET` | `/get-subscription-list` | ✅ Yes | Get list of all channels the logged-in user is subscribed to |
| `GET` | `/is-subscribed/:channelId?` | ✅ Yes | Check if logged-in user is subscribed to a channel |

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
