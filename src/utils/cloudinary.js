import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect the resource type (image, video, etc.)
    });
    //file uploaded successfully, delete the local file
    //console.log("File uploaded to Cloudinary:", response.url);
    fs.unlinkSync(localFilePath); // delete the local file after upload
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // delete the local file if upload fails
    return null;
  }
};

export { uploadOnCloudinary };