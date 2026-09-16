import { ApiError } from "../utils/ApiErrors.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Handles user registration requests and currently returns a basic success response.
const registerUser = asyncHandler(async (req, res) => {
  // Get user details from client (Front end)
  const { fullName, email, username, password } = req.body;
  console.log("Email: ", email);

  // Validation - not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // Check if user already exists: username, email
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  // Check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image not found");
  }
  // upload them to cloudinary, avatar
  const avatar =  await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }
  // create a user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()

  })

  // remove password and refresh token field from response
  // check for user creation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken" 
  )

  if(!createdUser) {
    throw new ApiError (500, "Something went wrong while registering the user")
  }
  // return res
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully.")
  )
});

export { registerUser };
