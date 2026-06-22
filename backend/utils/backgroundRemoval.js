import axios from "axios";

const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg";

export const isBackgroundRemovalConfigured = () =>
  Boolean(String(process.env.REMOVE_BG_API_KEY || "").trim());

export const removeImageBackground = async (file) => {
  if (!isBackgroundRemovalConfigured()) {
    const error = new Error(
      "Background removal is not configured. Add REMOVE_BG_API_KEY to the backend environment."
    );
    error.statusCode = 503;
    throw error;
  }

  if (!file?.buffer || !file?.mimetype) {
    const error = new Error("A valid image file is required");
    error.statusCode = 400;
    throw error;
  }

  const formData = new FormData();
  formData.append(
    "image_file",
    new Blob([file.buffer], { type: file.mimetype }),
    file.originalname || "product-image"
  );
  formData.append("size", "auto");
  formData.append("format", "png");

  try {
    const response = await axios.post(REMOVE_BG_API_URL, formData, {
      headers: {
        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
      },
      responseType: "arraybuffer",
      maxBodyLength: 15 * 1024 * 1024,
      timeout: 60000,
    });

    return {
      buffer: Buffer.from(response.data),
      mimetype: "image/png",
      originalname: `${file.originalname || "product-image"}-no-background.png`,
    };
  } catch (error) {
    const serviceMessage = Buffer.isBuffer(error.response?.data)
      ? error.response.data.toString("utf8")
      : "";
    const backgroundError = new Error(
      serviceMessage
        ? `Background removal failed: ${serviceMessage}`
        : "Background removal failed. Please try again or keep the original image."
    );
    backgroundError.statusCode = error.response?.status || 502;
    throw backgroundError;
  }
};
