import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Toggles subscription status (subscribes if unsubscribed, unsubscribes if already subscribed).
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // 1. Validate channel ID format
  if (!channelId?.trim() || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // 2. Prevent user from subscribing to their own channel
  if (channelId.toString() === req.user?._id?.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  // 3. Verify target channel exists in database
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // 4. Check if an active subscription relationship already exists
  const existingSubscription = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  // 5. Toggle logic:
  // If record exists -> Unsubscribe (remove relationship)
  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Unsubscribed successfully"
        )
      );
  }

  // If record does not exist -> Subscribe (create relationship)
  const newSubscription = await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSubscribed: true, subscription: newSubscription },
        "Subscribed successfully"
      )
    );
});

// Retrieves the total number of subscribers for a given channel.
const getSubscriberCount = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // 1. Validate channel ID format
  if (!channelId?.trim() || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // 2. Count all subscription documents where channel matches target ID
  const subscriberCount = await Subscription.countDocuments({
    channel: channelId.trim(),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { subscriberCount },
      "Subscriber count returned successfully"
    )
  );
});

// Retrieves the list of all subscribers for a given channel.
const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // 1. Validate channel ID
  if (!channelId?.trim() || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // 2. Find all subscriptions for this channel and populate subscriber profile info
  const subscribers = await Subscription.find({
    channel: channelId,
  }).populate("subscriber", "username fullName avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Subscribers fetched successfully"
      )
    );
});

// Retrieves the list of channels that a user is subscribed to.
const getSubscriptionsList = asyncHandler(async (req, res) => {
  // Option: Can take from route params (e.g. /:subscriberId) or default to the logged-in user
  const subscriberId = req.params?.subscriberId || req.user?._id;

  // 1. Validate subscriber ID
  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber/user ID");
  }

  // 2. Find all channels this user is subscribed to and populate channel profile info
  const channels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "username fullName avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels,
        "Subscribed channels fetched successfully"
      )
    );
});

// Checks whether the logged-in user is currently subscribed to a specific channel.
const isSubscribedTo = asyncHandler(async (req, res) => {
  // Support channelId from route params, query string (?channelId=...), or request body
  const channelId =
    req.params?.channelId || req.query?.channelId || req.body?.channelId;

  // 1. Validate channel ID
  if (!channelId?.trim() || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // 2. Efficiently check if subscription document exists without loading full document
  const isSubscribed = await Subscription.exists({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isSubscribed: Boolean(isSubscribed),
      },
      "Subscription status fetched successfully"
    )
  );
});

export {
  toggleSubscription,
  getSubscriberCount,
  getChannelSubscribers,
  getSubscriptionsList,
  isSubscribedTo,
};

