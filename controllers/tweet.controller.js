import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Creates a new tweet for the currently authenticated user.
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  // Validate tweet content: ensure it exists, is a string, and is not only whitespace
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required and cannot be empty");
  }

  // Ensure authenticated user information exists on the request
  const user = req.user;
  if (!user?._id) {
    throw new ApiError(401, "Unauthorized: User details not found");
  }

  // Create and persist the tweet in the database
  const tweet = await Tweet.create({
    content: content.trim(),
    owner: user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

// Fetches paginated tweets authored by a specific user.
const getUserTweets = asyncHandler(async (req, res) => {
  // 1. Extract target user ID from route parameters
  const { userId } = req.params;

  // 2. Validate user ID: ensure presence and verify it is a valid MongoDB ObjectId format
  if (!userId?.trim() || !isValidObjectId(userId)) {
    throw new ApiError(400, "A valid userId is required");
  }

  // 3. Extract pagination parameters from query string with safe fallback defaults
  const { page = 1, limit = 10 } = req.query;

  // 4. Construct the aggregation pipeline without awaiting:
  //    - Tweet.aggregate() returns an unexecuted Aggregate query object (cursor/builder).
  //    - We do NOT use 'await' here because aggregatePaginate() needs the raw query object
  //      to dynamically append $skip, $limit, and count facet stages before execution.
  const tweetAggregate = Tweet.aggregate([
    {
      // Filter tweets by owner. Mongoose does not auto-cast string IDs in aggregation
      // pipelines, so we explicitly instantiate a mongoose.Types.ObjectId.
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      // Sort tweets in descending order so the newest tweets appear first
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  // 5. Configure pagination options (page index and per-page document limit)
  const options = {
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.max(1, parseInt(limit, 10) || 10),
  };

  // 6. Execute pagination with await:
  //    aggregatePaginate runs the count query and paged data query concurrently.
  const tweets = await Tweet.aggregatePaginate(tweetAggregate, options);

  // 7. Return standardized response containing docs and pagination metadata
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

// Updates the content of an existing tweet.
const updateTweet = asyncHandler(async (req, res) => {
  // 1. Extract tweet ID from route parameters and new content from request body
  const { tweetId } = req.params;
  const { content } = req.body;

  // 2. Validate tweet ID: ensure presence and verify valid MongoDB ObjectId format
  if (!tweetId?.trim() || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "A valid tweet ID is required");
  }

  // 3. Validate tweet content: ensure it exists, is a string, and is not only whitespace
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required and cannot be empty");
  }

  // 4. Retrieve the tweet from the database
  const tweet = await Tweet.findById(tweetId.trim());
  console.log("tweet from update tweet -> ", tweet);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // 5. Verify ownership: ensure only the author can modify the tweet
  if (tweet.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  // 6. Update tweet content and persist changes
  tweet.content = content.trim();
  const updatedTweet = await tweet.save({ validateBeforeSave: true });

  if (!updatedTweet) {
    throw new ApiError(500, "Failed to update tweet");
  }

  // 7. Return standardized response with updated tweet details
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId?.trim() || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet ID is invalid.");
  }

  const tweet = await Tweet.findById(tweetId.trim());
  console.log("Tweet was: ", tweet);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  const response = await Tweet.findByIdAndDelete(tweetId);

  if (!response) {
    throw new ApiError(500, "Couldn't delete the tweet");
  }

  return res
  .status(200)
  .json(new ApiResponse(200, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
