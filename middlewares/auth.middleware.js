import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Read the JWT from cookies or the Authorization header, validate it, and attach the logged-in user to the request before continuing.
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      // TODO: Discuss the frontend response for an invalid access token.
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

// Optional JWT verification middleware:
// Attempts to authenticate the user if a valid token is present in cookies or the Authorization header,
// but gracefully continues without throwing an error if the user is unauthenticated or token is missing/invalid.
// This allows discovery pages (like Home and Recommended Users) to work for both guests and logged-in users.
export const verifyJWTOptional = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Gracefully ignore token validation failures for optional auth so guests can browse freely
  }
  next();
});

