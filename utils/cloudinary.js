import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { configDotenv } from "dotenv";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads a local file to Cloudinary and removes the temporary file if the upload fails.
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(
      "file has been uploaded to Cloudinart successfully",
      response.url
    );
    return response;
  } catch (error) {
    console.log("Error while uploading file", error);
    fs.unlink(localFilePath); // Remove the locally saved temporary file after an upload failure.
  }
};

// Uploads a sample image to Cloudinary when this module is evaluated.
const uploadResult = await cloudinary.uploader
  .upload(
    "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
    {
      public_id: "shoes",
    }
  )
  .catch((error) => {
    console.log(error);
  });

export { uploadOnCloudinary };
