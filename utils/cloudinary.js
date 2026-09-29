import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads a local file to Cloudinary and removes the temporary file afterward.
const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(
      "file has been uploaded to Cloudinary successfully",
      response.url
    );
    return response;
  } catch (error) {
    console.log("Error while uploading file", error);
    return null;
  } finally {
    await fs.unlink(localFilePath).catch((unlinkError) => {
      if (unlinkError.code !== "ENOENT") {
        console.log("Error while removing temporary file", unlinkError);
      }
    });
  }
};

export { uploadOnCloudinary };
