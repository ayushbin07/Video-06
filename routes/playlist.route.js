import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist } from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT);



// Registers createPlaylist as the handler for POST /api/v1/playlist/
router.route("/").post(createPlaylist);

export default router;

