import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);
// TODO: Add a login handler and connect it to the POST /login route.

export default router;
