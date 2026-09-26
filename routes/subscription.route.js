import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getSubscriberCount,
  getChannelSubscribers,
  getSubscriptionsList,
  isSubscribedTo,
} from "../controllers/subscription.controller.js";

const router = Router();

// Apply JWT authentication middleware to all subscription routes
router.use(verifyJWT);

// Toggle subscription status for a channel (subscribe / unsubscribe)
router.route("/toogle-subscription/:channelId").post(toggleSubscription);

// Get subscriber count for a channel
router.route("/count-subscriber/:channelId").get(getSubscriberCount);

// Get all subscribers of a channel
router.route("/get-subscribers/:channelId").get(getChannelSubscribers);

// Get all channels that the current user is subscribed to
router.route("/get-subscription-list").get(getSubscriptionsList);

// Check if current user is subscribed to a channel (via param /:channelId or query ?channelId=...)
router.route("/is-subscribed{/:channelId}").get(isSubscribedTo);

export default router;
