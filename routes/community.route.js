import { Router } from "express";
import {
  getAllCommunities,
  toggleJoinCommunity,
  getCommunityBySlug,
} from "../controllers/community.controller.js";
import { verifyJWT, verifyJWTOptional } from "../middlewares/auth.middleware.js";

const router = Router();

// Retrieve all community groups for discovery and dashboard cards (supports optional auth to calculate isMember)
router.route("/").get(verifyJWTOptional, getAllCommunities);

// Retrieve details for a single community by slug
router.route("/slug/:slug").get(verifyJWTOptional, getCommunityBySlug);

// Toggle membership (join / leave) for the authenticated user
router.route("/:communityId/join").post(verifyJWT, toggleJoinCommunity);

export default router;
