import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Adds a top-level comment to a tweet.
const addComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { content, tweetId } = req.body;

  if (!userId) {
    throw new ApiError(400, "User not logged in");
  }

  if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Valid Tweet ID is required");
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  // Create top-level comment referencing the tweet
  const comment = await Comment.create({
    tweet: tweetId,
    content: content.trim(),
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

// Adds a sub-comment (nested reply) referencing a parent comment.
const addSubComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { content, commentId } = req.body;

  if (!userId) {
    throw new ApiError(400, "User not logged in");
  }
  if (!commentId || !mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Valid Comment ID is required");
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    throw new ApiError(400, "Content cannot be empty");
  }

  // Create sub-comment referencing the parent comment
  const comment = await Comment.create({
    content: content.trim(),
    owner: userId,
    comment: commentId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Sub-comment added successfully"));
});

// Helper pipeline stages to populate user profile details including custom avatar and Blobatar settings
const userAuthorLookup = [
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
];

// Helper to recursively populate sub-comments (replies) up to a defined nesting depth.
// This allows users to comment on sub-comments, and have those nested replies returned with author details.
const buildNestedRepliesLookup = (maxDepth = 3) => {
  if (maxDepth <= 0) return [];
  return [
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "comment",
        pipeline: [
          ...userAuthorLookup,
          ...buildNestedRepliesLookup(maxDepth - 1),
          {
            $sort: { createdAt: 1 },
          },
        ],
        as: "replies",
      },
    },
  ];
};

// Fetches comments for a tweet with populated authors, nested sub-comments (replies to comments and sub-comments), and counts.
const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // 1. Validate tweet ID parameter
  if (!tweetId || !mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Valid Tweet ID is required");
  }

  // 2. Aggregate top-level comments for this tweet
  const commentAggregate = Comment.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
    // Populate top-level comment author details including Blobatar and avatar settings
    ...userAuthorLookup,
    // Recursively populate nested sub-comments so commenting on a sub-comment is supported
    ...buildNestedRepliesLookup(3),
    // Compute immediate sub-comments count for this top-level comment
    {
      $addFields: {
        repliesCount: { $size: "$replies" },
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
    limit: Math.max(1, parseInt(limit, 10) || 50),
  };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

export { addComment, addSubComment, getTweetComments };
