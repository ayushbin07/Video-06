import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";



const toggleTweetLike = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { tweetId } = req.body;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User details not found");
  }

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet ID is invalid");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "The tweet is unliked"));
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: userId,
  });

  return res.status(200).json(new ApiResponse(200, like, "The tweet is liked"));
});

const getTweetLikes = asyncHandler(async (req, res) => {
    const tweetId = req.body?.tweetId || req.query?.tweetId || req.params?.tweetId;


    if (!tweetId || !isValidObjectId(tweetId))  {
throw new ApiError(400, "Tweet ID is invalid");
    }


    const likeAggregate = Like.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            $unwind: "$owner",
        }
    ])

    const options = {
        page: Math.max(1, parseInt(req.query.page, 10) || 1),
        limit: Math.max(1, parseInt(req.query.limit, 10) || 10),
    };

    const likes = await Like.aggregatePaginate(likeAggregate, options);

    return res
    .status(200)
    .json(new ApiResponse(200, { ...likes, likeCount: likes.totalDocs }, "Likes fetched successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const commentId = req.body.commentId || req.query.commentId || req.params.commentId;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User details not found");
  }

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment ID is invalid");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });
    return res.status(200).json(new ApiResponse(200, null, "The comment is unliked"));
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: userId,
  });

  return res.status(200).json(new ApiResponse(200, like, "The comment is liked"));
});

const getCommentLikes = asyncHandler(async (req, res) => {
    const commentId = req.body?.commentId || req.query?.commentId || req.params?.commentId;

    if (!commentId || !isValidObjectId(commentId))  {
        throw new ApiError(400, "Comment ID is invalid");
    }

    const likeAggregate = Like.aggregate([
        {
            $match: {
                comment: new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            $unwind: "$owner",
        }
    ])

    const options = {
        page: Math.max(1, parseInt(req.query.page, 10) || 1),
        limit: Math.max(1, parseInt(req.query.limit, 10) || 10),
    };

    const likes = await Like.aggregatePaginate(likeAggregate, options);

    return res.status(200).json(new ApiResponse(200, { ...likes, likeCount: likes.totalDocs }, "Comment likes fetched successfully"));
});

export { toggleTweetLike, getTweetLikes, toggleCommentLike, getCommentLikes };
