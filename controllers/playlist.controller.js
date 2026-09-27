import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { playlistName, desc, videoIds } = req.body;

  const userId = req.user?._id;
  // ?. (optional chaining) — safely reads _id without crashing if req.user is undefined

  if (!playlistName.trim() || !videoIds || videoIds.length === 0) {
    // .trim() strips whitespace, then ! checks if the result is an empty string
    throw new ApiError(400, "Playlist name or videoIds cannot be empty");
  }

  if (!videoIds.every((id) => isValidObjectId(id))) {
    // .every() loops through the array — returns false if even ONE id fails isValidObjectId()
    throw new ApiError(400, "One or more videoIds are invalid");
  }

  if (!userId || !isValidObjectId(userId)) {
    // isValidObjectId() — checks if userId is a valid 24-char MongoDB ObjectId hex string
    throw new ApiError(400, "Invalid User ID");
  }

  // .create() builds the document + saves to MongoDB in one step, returns the saved doc
  const playlist = await Playlist.create({
    name: playlistName,
    description: desc,
    videos: videoIds,
    owner: userId,
  });

  // new ApiResponse(statusCode, data, message) — wraps data into a consistent response shape
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

export { createPlaylist };
