import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Creates a new tweet for the currently authenticated user.
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const mediaPath = req.file?.path;

  // Validate tweet content: ensure it exists, is a string, and is not only whitespace
  if (!content || typeof content !== "string" || content.trim() === "") {
    throw new ApiError(400, "Tweet content is required and cannot be empty");
  }

  // Ensure authenticated user information exists on the request
  const user = req.user;
  if (!user?._id) {
    throw new ApiError(401, "Unauthorized: User details not found");
  }

  let media;
  if (mediaPath) {
    const mediaFile = await uploadOnCloudinary(mediaPath);

    if (!mediaFile) {
      throw new ApiError(400, "Tweet media could not be uploaded");
    }

    media = {
      url: mediaFile.secure_url || mediaFile.url,
      type: mediaFile.resource_type,
    };
  }

  // Create and persist the tweet in the database
  const tweet = await Tweet.create({
    content: content.trim(),
    owner: user._id,
    media,
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
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
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

// Deletes a tweet by its ID, confirms ownership by authenticated user, and cascades deletion to likes.
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  // 1. Validate tweet ID parameter
  if (!tweetId?.trim() || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet ID is invalid.");
  }

  // 2. Fetch target tweet to check existence and ownership
  const tweet = await Tweet.findById(tweetId.trim());

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // 3. Confirm that the authenticated user is the owner of the tweet
  if (tweet.owner.toString() !== req.user?._id?.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

  // 4. Delete the tweet document from the database
  const response = await Tweet.findByIdAndDelete(tweetId);

  if (!response) {
    throw new ApiError(500, "Couldn't delete the tweet");
  }

  // 5. Cascade delete: remove any likes associated with this tweet
  await Like.deleteMany({ tweet: tweetId });

  return res
    .status(200)
    .json(new ApiResponse(200, { tweetId }, "Tweet deleted successfully"));
});

const getCommunityTweets = asyncHandler(async (req, res) => {
  // extreact user ID
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User details not found");
  }

  // Extract pagination parameters from query string with safe fallback defaults
  const { page = 1, limit = 10 } = req.query;

  // Build aggregation pipeline to retrieve community tweets from all creators (including the authenticated user)
  // so users can view their own posts, manage them, and use the delete tweet API.
  const tweetAggregate = Tweet.aggregate([
    {
      $sort: { createdAt: -1 },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    // fetch past 1 tweet of user (excluding the current one)
    {
      $lookup: {
        from: "tweets",
        let: { ownerId: "$owner._id", currentTweetId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$owner", "$$ownerId"] },
                  //{ $ne: ["$_id", "$$currentTweetId"] }
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "lastTweet",
      },
    },
    // Lookup comments to compute total comments count on each tweet
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments",
      },
    },
    // Lookup likes to compute total likes count on each tweet
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $addFields: {
        lastTweet: { $first: "$lastTweet" },
        commentsCount: { $size: "$comments" },
        likesCount: { $size: "$likes" },
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const options = {
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: Math.max(1, parseInt(limit, 10) || 10),
  };

  const tweets = await Tweet.aggregatePaginate(tweetAggregate, options);

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweets, "Community tweets fetched successfully")
    );
});

// Retrieves active discussions with reply counts and author details.
// Sorted by replies count and recency to highlight engaging conversations on the home dashboard.
const getActiveDiscussions = asyncHandler(async (req, res) => {
  const { limit = 6 } = req.query;

  const discussions = await Tweet.aggregate([
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "comments",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              avatarType: 1,
              blobatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $addFields: {
        repliesCount: { $size: "$comments" },
      },
    },
    {
      $sort: { repliesCount: -1, createdAt: -1 },
    },
    {
      $limit: parseInt(limit, 10) || 6,
    },
    {
      $project: {
        _id: 1,
        content: 1,
        repliesCount: 1,
        media: 1,
        owner: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, discussions, "Active discussions fetched successfully")
    );
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
  getCommunityTweets,
  getActiveDiscussions,
};

