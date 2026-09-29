import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateBlobatarConfig,
  updateUserCoverImage,
  getReccomendedUsersToFollow,
  getRecentActivity,
} from "../controllers/user.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
// Connect the login handler to the POST /login route.
router.route("/login").post(loginUser);

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser); //Checked
router.route("/refresh-token").post(refreshAccessToken); //Checked
router.route("/change-password").post(verifyJWT, changeCurrentPassword); //Checked
(router.route("/current-user").get(verifyJWT, getCurrentUser)); //Checked
router.route("/update-account").patch(verifyJWT, updateAccountDetails); //Checked
// Middleware: Check request Content-Type.
// - If multipart/form-data: invoke multer upload.single("avatar") to parse the image file.
// - If application/json: skip multer so express.json() parses body (e.g. { avatarType: "blobatar" }) directly.
const handleAvatarUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.single("avatar")(req, res, next);
  }
  next();
};

// Route for updating avatar image or switching active avatarType ("blobatar" | "upload") in database
router
  .route("/avatar")
  .patch(verifyJWT, handleAvatarUpload, updateUserAvatar);

// Route for saving Blobatar customization config (hue, tone, traits, palette, expression) in database
router
  .route("/avatar/blobatar")
  .patch(verifyJWT, updateBlobatarConfig);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); //Checked
router.route("/c/:username").get(verifyJWT, getUserChannelProfile); //Checked
// Route for retrieving recommended users (supports optional auth so guests can also discover creators)
router.route("/get-recommended-users").get(verifyJWTOptional, getReccomendedUsersToFollow);

// Route for retrieving recent authentic community activity (replies, follows, new posts)
router.route("/recent-activity").get(verifyJWTOptional, getRecentActivity);

export default router;
