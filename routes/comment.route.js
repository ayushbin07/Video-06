import { Router } from "express";

import {
  addComment,
  addSubComment,
  getTweetComments,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/add-comment").post(addComment);
router.route("/add-sub-comment").post(addSubComment);
router.route("/tweet/:tweetId").get(getTweetComments);

export default router;
