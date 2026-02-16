import multer from "multer";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const cloudinaryStorage = {
  _handleFile(req, file, cb) {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ecommerce-products",
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) {
          return cb(error);
        }

        return cb(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      }
    );

    file.stream.pipe(stream);
  },

  _removeFile(req, file, cb) {
    if (!file?.filename) {
      return cb(null);
    }

    cloudinary.uploader
      .destroy(file.filename, { resource_type: "image" })
      .finally(() => cb(null));
  },
};

const storage = isCloudinaryConfigured ? cloudinaryStorage : multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
