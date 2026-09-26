import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
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

// Registers the user routes under the /api/v1/users URL prefix.
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);

export { app };
