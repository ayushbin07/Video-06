import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleTweetLike, getTweetLikes, toggleCommentLike, getCommentLikes } from "../controllers/like.controller.js";

const router = Router();
router.use(verifyJWT);

router.route("/toggle/tweet").post(toggleTweetLike);
router.route("/tweet").get(getTweetLikes);
router.route("/toggle/comment").post(toggleCommentLike);
router.route("/comment").get(getCommentLikes);

export default router;