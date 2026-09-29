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
  updateUserCoverImage,
  getReccomendedUsersToFollow
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
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
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar); //Checked
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); //Checked
router.route("/c/:username").get(verifyJWT, getUserChannelProfile); //Checked
router.route("/history").get(verifyJWT, getWatchHistory); //In Progress
router.route("/get-recommended-users").get(verifyJWT, getReccomendedUsersToFollow); //In Progress


export default router;
