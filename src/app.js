import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin:
      !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === "*"
        ? true
        : process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

// Routes
import userRouter from "../routes/user.routes.js";
import tweetRouter from "../routes/tweet.route.js";
import subscriptionRouter from "../routes/subscription.route.js";
import playlistRouter from "../routes/playlist.route.js";
import healthCheckRouter from "../routes/healthcheck.route.js";
import videoRouter from "../routes/video.route.js";
import likeRouter from "../routes/like.routes.js";
import commentRouter from "../routes/comment.route.js";
import communityRouter from "../routes/community.route.js";

// Registers the user routes under the /api/v1/users URL prefix.
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
//app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
// Registers community routes for discovery, membership, and dashboard cards
app.use("/api/v1/communities", communityRouter);

// Global Error Handler Middleware: returns JSON responses for all ApiErrors
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  return res.status(statusCode).json({
    statusCode,
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    data: null,
  });
});

export { app };
