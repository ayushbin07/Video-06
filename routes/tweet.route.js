import { Router } from "express";

import {
  createTweet,
  deleteTweet,
  getCommunityTweets,
  getUserTweets,
  updateTweet,
  getActiveDiscussions,
} from "../controllers/tweet.controller.js";
import { tweetMediaUpload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";

const router = Router();

// Public / optional auth route to discover active discussions on Home dashboard
router.route("/active-discussions").get(verifyJWTOptional, getActiveDiscussions);

// Authenticated routes below
router.use(verifyJWT);

router
  .route("/create-tweet")
  .post(tweetMediaUpload.single("media"), createTweet);
router.route("/get-community-tweets").get(getCommunityTweets);
router.route("/get-user-tweets/:userId").get(getUserTweets);
router.route("/update-tweet/:tweetId").patch(updateTweet);
router.route("/delete-tweet/:tweetId").delete(deleteTweet);

export default router;

