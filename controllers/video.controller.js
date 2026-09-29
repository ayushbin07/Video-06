import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, desc } = req.body;
  if (
    !title.trim() ||
    !desc.trim() ||
    typeof title !== "string" ||
    typeof desc !== "string"
  ) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoPath = req.files?.video[0]?.path;

  if (!videoPath) {
    throw new ApiError(400, "Video is required");
  }

  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailPath);

  if (!videoFile) {
    throw new ApiError(400, "Video is not uploaded");
  }
  if (!thumbnailFile) {
    throw new ApiError(400, "Thumbnail is not uploaded");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnailFile.url,
    title,
    description: desc,
    duration: Number(videoFile.duration),
    owner: req.user?._id,
    isPublished: true,
    views: 0,
  });

  if (!video) {
    throw new ApiError(500, "Failed to upload video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video is published successfully"));
});

export { publishVideo };
