import { ApiError } from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";

// Generates access and refresh tokens for a user and stores the refresh token on the user record.

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    console.log("Here is the access token: \n", accessToken);
    const refreshToken = user.generateRefreshToken();
    console.log("Here is the refresh token: \n", refreshToken);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

// Registers a user, uploads the profile images, saves the user in MongoDB, and returns the profile without sensitive fields.

const registerUser = asyncHandler(async (req, res) => {
  // Get user details from client (frontend)
  const { fullName, email, username, password } = req.body;
  console.log("Email: ", email);

  // Validation - not empty
  if (
    [fullName, email, username, password].some((field) => !field || field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  // Check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [
      { username: cleanUsername },
      { email: cleanEmail },
    ],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Check for images, check for avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let avatarUrl = "";

  if (avatarLocalPath) {
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (avatar?.url) {
      avatarUrl = avatar.url;
    }
  }

  // Discard any legacy placeholder or dicebear avatar URLs; only accept real uploads
  if (avatarUrl && avatarUrl.includes("dicebear")) {
    avatarUrl = "";
  }
  if (!avatarUrl && req.body.avatar && !req.body.avatar.includes("dicebear")) {
    avatarUrl = req.body.avatar.trim();
  }

  // Parse initial blobatar options if provided by the client
  let blobatarConfig = undefined;
  if (req.body.blobatar) {
    if (typeof req.body.blobatar === "object") {
      blobatarConfig = req.body.blobatar;
    } else if (typeof req.body.blobatar === "string") {
      try {
        const parsed = JSON.parse(req.body.blobatar);
        if (typeof parsed === "object") blobatarConfig = parsed;
      } catch {
        // Ignore unparseable strings
      }
    }
  }

  // Determine avatarType:
  // By default, every user without an uploaded avatar image uses Blobatar.
  // If user uploaded a valid photo and requested "upload", set "upload".
  let avatarType = "blobatar";
  if (req.body.avatarType === "upload" && avatarUrl) {
    avatarType = "upload";
  } else if (req.body.avatarType === "blobatar") {
    avatarType = "blobatar";
  } else if (avatarUrl) {
    avatarType = "upload";
  } else {
    // No avatar image: Blobatar is strictly the default
    avatarType = "blobatar";
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // create a user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatarUrl || undefined,
    avatarType,
    blobatar: blobatarConfig,
    coverImage: coverImage?.url || "",
    email: cleanEmail,
    password,
    username: cleanUsername,
  });

  // remove password and refresh token field from response
  // check for user creation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully."));
});

// Verifies login credentials, issues JWT tokens in cookies, and returns the logged-in user's profile.

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body || {};
  const rawIdentifier = (username || email || "").trim();
  if (!rawIdentifier) {
    throw new ApiError(400, "Username or Email is required");
  }

  const cleanIdentifier = rawIdentifier.toLowerCase();

  // Find the matching user (checks username or email case-insensitively).
  const user = await User.findOne({
    $or: [
      { username: cleanIdentifier },
      { email: cleanIdentifier },
      { email: rawIdentifier },
    ],
  });

  if (!user) {
    throw new ApiError(404, "Username or email doesn't exist");
  }

  // Check the supplied password.
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Password is incorrect");
  }

  // Generate access and refresh tokens.
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Send the tokens as cookies.
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// Logs the user out by removing the stored refresh token and clearing the JWT cookies.

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// Verifies a refresh token, creates replacement tokens, and sends them as cookies.

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
    console.log("Refresh token error: ", error);
  }
});

// Verifies the current password and saves a new password for the authenticated user.

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Returns the authenticated user's profile from the request.

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// Updates the authenticated user's name and email address in MongoDB.

const updateAccountDetails = asyncHandler(async (req, res) => {
  console.log(req.body); // Logs the request body
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "Need both user and email");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// Uploads a new avatar or switches active avatarType between "blobatar" and "upload".
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  const requestedAvatarType = req.body?.avatarType;

  // Case 1: Image file is uploaded
  if (avatarLocalPath) {
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
          avatarType: "upload",
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Avatar updated successfully."));
  }

  // Case 2: Switching active avatar type (e.g. { avatarType: "blobatar" } or { avatarType: "upload" })
  // The user's avatar preference is explicitly stored in the MongoDB database document.
  if (requestedAvatarType) {
    if (!["blobatar", "upload"].includes(requestedAvatarType)) {
      throw new ApiError(400, "Invalid avatarType. Must be 'blobatar' or 'upload'.");
    }

    // When switching to uploaded photo mode, verify that the user actually has a valid uploaded image in the DB
    if (requestedAvatarType === "upload") {
      const userDoc = await User.findById(req.user?._id);
      const hasUploadedPhoto = Boolean(
        userDoc?.avatar &&
        userDoc.avatar.trim() !== "" &&
        !userDoc.avatar.includes("dicebear")
      );
      if (!hasUploadedPhoto) {
        throw new ApiError(
          400,
          "No uploaded profile picture found. Please upload a photo before switching to upload mode."
        );
      }
    }

    // Permanently persist the user's avatarType choice into the database
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatarType: requestedAvatarType,
        },
      },
      { new: true }
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUser,
          `Avatar choice saved to database: active avatar switched to ${requestedAvatarType}.`
        )
      );
  }

  throw new ApiError(400, "Avatar file or avatarType is required");
});

// Updates Blobatar configuration options for the authenticated user and activates blobatar mode.
const updateBlobatarConfig = asyncHandler(async (req, res) => {
  const { hue, tone, traits, palette, expression } = req.body || {};

  const cleanBlobatar = {};

  if (hue !== undefined && hue !== null && hue !== "") {
    const numHue = Number(hue);
    if (isNaN(numHue)) {
      throw new ApiError(400, "Hue must be a valid number");
    }
    cleanBlobatar.hue = numHue;
  }

  if (tone !== undefined && tone !== null && tone !== "") {
    const numTone = Number(tone);
    if (isNaN(numTone) || numTone < 0 || numTone > 1) {
      throw new ApiError(400, "Tone must be a number between 0 and 1");
    }
    cleanBlobatar.tone = numTone;
  }

  if (traits !== undefined && traits !== null) {
    if (typeof traits !== "object" || Array.isArray(traits)) {
      throw new ApiError(400, "Traits must be an object");
    }
    cleanBlobatar.traits = traits;
  }

  if (palette !== undefined && palette !== null) {
    if (typeof palette !== "object" || Array.isArray(palette)) {
      throw new ApiError(400, "Palette must be an object of color mappings");
    }
    cleanBlobatar.palette = palette;
  }

  if (expression !== undefined && expression !== null && expression !== "") {
    if (typeof expression !== "string") {
      throw new ApiError(400, "Expression must be a string");
    }
    cleanBlobatar.expression = expression.trim();
  }

  // Identity is always req.user._id (never client controlled).
  // Update blobatar sub-document and set active avatarType to blobatar.
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        blobatar: cleanBlobatar,
        avatarType: "blobatar",
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser,
        "Blobatar configuration updated successfully."
      )
    );
});

// Uploads a new cover image and saves its Cloudinary URL for the authenticated user.

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image is missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

// Builds a channel profile with subscriber counts and subscription status.

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        email: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        // Project avatarType and blobatar customization so visitors to the channel see the user's active avatar & styling
        avatarType: 1,
        blobatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists");
  }

  console.log("\n", channel, "\n");

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

// Builds the authenticated user's watch history and includes basic video-owner details.

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
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
                    // Project avatarType and blobatar so video creators in watch history render with their chosen avatar
                    avatarType: 1,
                    blobatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

// Retrieves recommended users to follow based on subscriber popularity and community presence.
// Supports both authenticated users (excluding already-followed users and self) and guest visitors.
const getReccomendedUsersToFollow = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;
  const currentUserId = req.user?._id
    ? new mongoose.Types.ObjectId(req.user._id)
    : null;

  const matchFilter = currentUserId
    ? { _id: { $ne: currentUserId } }
    : {};

  const pipeline = [
    {
      $match: matchFilter,
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
  ];

  if (currentUserId) {
    // Exclude users already followed by the current user
    pipeline.push({
      $match: {
        "subscribers.subscriber": { $ne: currentUserId },
      },
    });
  }

  pipeline.push(
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        isSubscribed: false,
      },
    },
    {
      $sort: { subscribersCount: -1, createdAt: -1 },
    },
    {
      $limit: parseInt(limit, 10) || 8,
    },
    {
      $project: {
        _id: 1,
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        avatarType: 1,
        blobatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        isSubscribed: 1,
      },
    }
  );

  const users = await User.aggregate(pipeline);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        users,
        "Recommended users to follow fetched successfully"
      )
    );
});

// Gathers recent authentic community activity (replies, follows, and new posts)
// to power the homepage recent activity timeline without mock data.
const getRecentActivity = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id?.toString();

  // 1. Fetch recent comments and replies with author and tweet info
  const recentComments = await Comment.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("owner", "fullName username avatar avatarType blobatar")
    .populate("tweet", "content owner")
    .populate("comment", "content owner");

  // 2. Fetch recent subscriptions (follows)
  const recentSubs = await Subscription.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .populate("subscriber", "fullName username avatar avatarType blobatar")
    .populate("channel", "fullName username avatar avatarType blobatar");

  // 3. Fetch recent community tweets
  const recentTweets = await Tweet.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .populate("owner", "fullName username avatar avatarType blobatar");

  const activities = [];

  // Format comments / replies
  for (const c of recentComments) {
    if (!c.owner) continue;
    const isCurrentUserPost = c.tweet?.owner?.toString() === currentUserId;
    const authorName = c.owner.fullName || c.owner.username;

    let description = "";
    if (isCurrentUserPost && currentUserId) {
      description = `${authorName} replied to your post`;
    } else if (c.tweet?.content) {
      const snippet =
        c.tweet.content.length > 35
          ? c.tweet.content.slice(0, 35) + "..."
          : c.tweet.content;
      description = `${authorName} replied: "${snippet}"`;
    } else {
      description = `${authorName} commented in the community`;
    }

    activities.push({
      id: `comment-${c._id}`,
      type: "reply",
      user: c.owner,
      text: description,
      targetId: c.tweet?._id || c._id,
      createdAt: c.createdAt,
    });
  }

  // Format follows
  for (const s of recentSubs) {
    if (!s.subscriber || !s.channel) continue;
    const subName = s.subscriber.fullName || s.subscriber.username;
    const channelName = s.channel.fullName || s.channel.username;
    activities.push({
      id: `sub-${s._id}`,
      type: "follow",
      user: s.subscriber,
      text: `${subName} started following ${channelName}`,
      targetId: s.channel.username,
      createdAt: s.createdAt,
    });
  }

  // Format posts
  for (const t of recentTweets) {
    if (!t.owner) continue;
    const authorName = t.owner.fullName || t.owner.username;
    const snippet =
      t.content.length > 40 ? t.content.slice(0, 40) + "..." : t.content;
    activities.push({
      id: `tweet-${t._id}`,
      type: "post",
      user: t.owner,
      text: `${authorName} posted: "${snippet}"`,
      targetId: t._id,
      createdAt: t.createdAt,
    });
  }

  // Sort combined activity stream by most recent first
  activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Limit to top 8 items
  const limitedActivities = activities.slice(0, 8);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        limitedActivities,
        "Recent activity fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateBlobatarConfig,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  getReccomendedUsersToFollow,
  getRecentActivity,
};

