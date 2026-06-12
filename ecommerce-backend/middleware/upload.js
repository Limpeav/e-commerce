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

export const createMemoryImageUpload = () =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype?.startsWith("image/")) {
        callback(new Error("Only image files are allowed"));
        return;
      }

      callback(null, true);
    },
  });

const upload = createUpload("uploads");

export default upload;
