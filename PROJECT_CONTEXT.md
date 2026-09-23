# Video-06 — Project Context

## What this project is

This is an ES-module Node.js backend for a YouTube-style application, built as part of the *Chai aur Code* backend series. It currently concentrates on user accounts: registration, login, JWT authentication, profile maintenance, channel details, and watch history. MongoDB stores application data and Cloudinary stores uploaded images.

The application name is `video-06`; the MongoDB database name is fixed to `videotube`.

## Technology and structure

| Area | Choice |
| --- | --- |
| HTTP server | Express 5 |
| Database / ODM | MongoDB with Mongoose |
| Authentication | JWT access and refresh tokens, `bcrypt` password hashing |
| Uploads | Multer temporary disk storage, then Cloudinary |
| Development command | `npm run dev` (Nodemon) |

```text
src/index.js                  loads .env, connects MongoDB, starts Express
src/app.js                    middleware and route mounting
db/index.js                   Mongoose connection
routes/user.routes.js         HTTP route definitions
controllers/user.controller.js user/account business logic
middlewares/                  JWT guard and Multer configuration
models/                       User, Video, and Subscription schemas
utils/                        Cloudinary upload and API helper classes
public/temp/                  temporary upload location
```

## Startup flow

1. `src/index.js` reads `.env` and calls `connectDB()`.
2. `db/index.js` connects to `${MONGODB_URI}/videotube`.
3. On a successful connection, Express starts on `PORT` (default: `8000`).
4. `src/app.js` enables CORS, JSON/form parsing, static files, cookies, and mounts the user router at `/api/v1/users`.

Copy the placeholders in `.env.sample` into `.env` and supply real values for MongoDB, JWT secrets, and Cloudinary before starting the server. `.env` is ignored by Git.

## Data model

- **User**: username, email, full name, avatar, optional cover image, hashed password, stored refresh token, and an array of watched video IDs.
- **Video**: video file URL, thumbnail URL, title, description, duration, view count, publication flag, and owner.
- **Subscription**: joins a `subscriber` user to a `channel` user.

The video and subscription schemas exist for the channel/history queries, but there are not yet video or subscription route/controller modules.

## Implemented API

All paths below are relative to `/api/v1/users`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/register` | No | Create an account. Multipart form: `fullName`, `email`, `username`, `password`, required `avatar`, optional `coverImage`. Images are uploaded to Cloudinary. |
| POST | `/login` | No | Sign in with `email` or `username` plus `password`; sets token cookies and also returns tokens in JSON. |
| POST | `/logout` | Yes | Removes the saved refresh token and clears token cookies. |
| POST | `/refresh-token` | No | Exchanges a refresh token from a cookie or request body for a new token pair. |
| POST | `/change-password` | Yes | Requires `oldPassword` and `newPassword`. |
| GET | `/current-user` | Yes | Intended to return the authenticated user. See issue below. |
| PATCH | `/update-account` | Yes | Updates `fullName` and `email`. |
| PATCH | `/avatar` | Yes | Multipart upload field: `avatar`. |
| PATCH | `/cover-image` | Yes | Multipart upload field: `coverImage`. |
| GET | `/c/:username` | Yes | Returns the channel profile, subscriber counts, subscribed-channel count, and whether the caller subscribes. |
| GET | `/history` | Yes | Returns the caller's watched videos with basic owner details. |

For protected endpoints, the intent is to accept either the `accessToken` cookie or an `Authorization: Bearer <token>` header.

## Current state / resume checklist

The most recent work added account-management routes and then channel-profile/watch-history retrieval. Before manually testing, fix these visible issues:

1. **Server cannot load the user router:** `routes/user.routes.js` uses `get(verifyJWT, getCurrentUser)` rather than `.get(verifyJWT, getCurrentUser)` for `/current-user`. `get` is not defined, so importing the routes will throw a `ReferenceError`.
2. **Cookie authentication currently has a typo:** `auth.middleware.js` reads `req.cookie?.accessToken`; Cookie Parser supplies `req.cookies`. Header-based Bearer auth should still work.
3. **Some response helpers are not used consistently:** `getCurrentUser`, avatar update, and cover-image update call `res.json(...)` with multiple arguments instead of wrapping data in `new ApiResponse(...)`. Express only uses the first argument.
4. **Missing `await`:** `changeCurrentPassword` calls `user.save(...)` without awaiting it; `updateAccountDetails` also returns an unresolved Mongoose query rather than the updated document.
5. **Token logging:** `generateAccessAndRefreshToken` logs both token values. Remove these logs outside local debugging.
6. **Cookie setting uses `secure: true`:** this generally requires HTTPS, so local HTTP browser testing may not retain the cookies. Bearer headers are a useful temporary testing path.

There is no test suite yet (`npm test` intentionally exits with an error). The `postman/` folder currently contains workspace globals only, not an API collection.

## Suggested next step

Fix the six items above, then add an Express error-handling middleware and a Postman/Thunder Client collection for the register → login → protected-route flow. After that, the natural next feature is CRUD routes for videos, followed by subscriptions.
