import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Community schema: Represents invite-only and public circles / interest groups (e.g. Dev Club, JAIN CSE, Projects)
// Stores member relations, post counters, and metadata for discovery
const communitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
    icon: {
      type: String,
      default: "",
    },
    banner: {
      type: String,
      default: "",
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

communitySchema.plugin(mongooseAggregatePaginate);

export const Community = mongoose.model("Community", communitySchema);
