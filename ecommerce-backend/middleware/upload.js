import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const createUpload = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    },
  });
  return multer({ storage });
};

const upload = createUpload("uploads");

export default upload;