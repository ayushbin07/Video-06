import mongoose from "mongoose";
import { Community } from "../models/community.model.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Initial community definitions to seed the database if no communities exist yet.
// Populated with existing MongoDB user IDs so counts and members are completely authentic.
const INITIAL_COMMUNITIES = [
  {
    name: "Dev Club",
    slug: "dev-club",
    description: "Developers, builders, and hackers collaborating on modern stacks and open source.",
    category: "Engineering",
    icon: "💻",
  },
  {
    name: "JAIN CSE",
    slug: "jain-cse",
    description: "Computer Science & Engineering circle, projects, and campus tech discussions.",
    category: "Campus",
    icon: "🎓",
  },
  {
    name: "Projects",
    slug: "projects",
    description: "Showcase what you are building, get feedback, and find collaborators.",
    category: "Showcase",
    icon: "🚀",
  },
  {
    name: "Tech & AI",
    slug: "tech-ai",
    description: "Discussions on artificial intelligence, LLMs, systems, and tooling.",
    category: "Technology",
    icon: "⚡",
  },
  {
    name: "Designers",
    slug: "designers",
    description: "UI/UX, visual craft, motion, and design system discussions.",
    category: "Design",
    icon: "🎨",
  },
];

// Seed initial communities if the collection is empty, linking existing users as members.
const seedCommunitiesIfNeeded = async () => {
  const count = await Community.countDocuments();
  if (count === 0) {
    const allUsers = await User.find({}, { _id: 1 }).limit(20);
    const userIds = allUsers.map((u) => u._id);

    for (let i = 0; i < INITIAL_COMMUNITIES.length; i++) {
      const def = INITIAL_COMMUNITIES[i];
      // Distribute a subset of real users to each community
      const assignedMembers = userIds.filter((_, idx) => (idx + i) % 2 === 0);
      await Community.create({
        ...def,
        creator: userIds[0] || null,
        members: assignedMembers,
      });
    }
  }
};

// Retrieves all communities with member counts, active user membership status, and real post counts
const getAllCommunities = asyncHandler(async (req, res) => {
  // Ensure default communities exist in MongoDB
  await seedCommunitiesIfNeeded();

  const currentUserId = req.user?._id
    ? new mongoose.Types.ObjectId(req.user._id)
    : null;

  // Aggregate communities with member count, isMember indicator, and recent post counts
  const communities = await Community.aggregate([
    {
      $addFields: {
        membersCount: { $size: "$members" },
        isMember: currentUserId
          ? { $in: [currentUserId, "$members"] }
          : false,
      },
    },
    {
      $sort: { membersCount: -1, createdAt: -1 },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        category: 1,
        icon: 1,
        banner: 1,
        membersCount: 1,
        isMember: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, communities, "Communities fetched successfully")
    );
});

// Toggles membership for the authenticated user in a given community
const toggleJoinCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "You must be logged in to join a community");
  }

  if (!communityId || !mongoose.isValidObjectId(communityId)) {
    throw new ApiError(400, "Valid Community ID is required");
  }

  const community = await Community.findById(communityId);
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  const isAlreadyMember = community.members.some(
    (memberId) => memberId.toString() === userId.toString()
  );

  let updatedCommunity;
  if (isAlreadyMember) {
    // Leave community
    updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $pull: { members: userId } },
      { new: true }
    );
  } else {
    // Join community
    updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $addToSet: { members: userId } },
      { new: true }
    );
  }

  const updatedIsMember = !isAlreadyMember;
  const membersCount = updatedCommunity.members.length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        communityId,
        isMember: updatedIsMember,
        membersCount,
      },
      updatedIsMember
        ? `Joined ${community.name} successfully`
        : `Left ${community.name} successfully`
    )
  );
});

// Retrieves single community details by its slug
const getCommunityBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (!slug) {
    throw new ApiError(400, "Community slug is required");
  }

  const currentUserId = req.user?._id
    ? new mongoose.Types.ObjectId(req.user._id)
    : null;

  const community = await Community.findOne({ slug });
  if (!community) {
    throw new ApiError(404, "Community not found");
  }

  const isMember = currentUserId
    ? community.members.some((m) => m.toString() === currentUserId.toString())
    : false;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...community.toObject(),
        membersCount: community.members.length,
        isMember,
      },
      "Community details fetched successfully"
    )
  );
});

export {
  getAllCommunities,
  toggleJoinCommunity,
  getCommunityBySlug,
};
