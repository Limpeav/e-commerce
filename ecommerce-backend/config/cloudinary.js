import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const hasNamedCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);

if (hasNamedCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else if (hasCloudinaryUrl) {
  cloudinary.config({
    secure: true,
  });
}

export const isCloudinaryConfigured =
  hasNamedCloudinaryConfig || hasCloudinaryUrl;

export default cloudinary;
