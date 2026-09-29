import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
    media: {
      url: {
        type: String,
      },
      type: {
        type: String,
        enum: ["image", "video"],
      },
    },
  },
  {
    timestamps: true,
  }
);

tweetSchema.plugin(mongooseAggregatePaginate);
export const Tweet = mongoose.model("Tweet", tweetSchema);
