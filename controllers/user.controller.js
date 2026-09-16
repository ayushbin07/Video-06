import asyncHandler from "../utils/asyncHandler.js";

// Handles user registration requests and currently returns a basic success response.
const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export { registerUser };

