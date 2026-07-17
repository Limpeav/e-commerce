import "../config/env.js";
import mongoose from "mongoose";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

const PRODUCT_TITLE = "CarryCloud 3-in-1 Baby Hip Seat Carrier";
const GENERATED_FOLDER = "products/generated/baby-hip-seat-carrier";
const ASSET_DIR = "generated-product-images/baby-hip-seat-carrier";

const detailAssetsByColor = [
  {
    color: "Charcoal Gray",
    assets: [
      `${ASSET_DIR}/charcoal-gray-shoulder-strap-detail.png`,
      `${ASSET_DIR}/charcoal-gray-safety-buckle-detail.png`,
      `${ASSET_DIR}/charcoal-gray-hip-seat-detail.png`,
    ],
  },
  {
    color: "Forest Green",
    assets: [
      `${ASSET_DIR}/forest-green-shoulder-strap-detail.png`,
      `${ASSET_DIR}/forest-green-safety-buckle-detail.png`,
      `${ASSET_DIR}/forest-green-mesh-panel-detail.png`,
      `${ASSET_DIR}/forest-green-hip-seat-detail.png`,
    ],
  },
];

const uploadImage = async (filePath) => {
  const publicId = path.basename(filePath, path.extname(filePath));
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `${GENERATED_FOLDER}/details`,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });

  return result.secure_url;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const product = await Product.findOne({ title: PRODUCT_TITLE });
  if (!product) {
    throw new Error(`Product not found: ${PRODUCT_TITLE}`);
  }

  for (const detailGroup of detailAssetsByColor) {
    const images = [];
    for (const assetPath of detailGroup.assets) {
      images.push(await uploadImage(assetPath));
    }

    const existingGroup = product.productDetailImages.find(
      (entry) => entry.color === detailGroup.color
    );

    if (existingGroup) {
      existingGroup.images = images;
    } else {
      product.productDetailImages.push({
        color: detailGroup.color,
        images,
      });
    }
  }

  await product.save();

  console.log(
    JSON.stringify(
      {
        updated: true,
        id: product._id.toString(),
        title: product.title,
        detailGroups: product.productDetailImages.map((entry) => ({
          color: entry.color,
          count: entry.images.length,
        })),
      },
      null,
      2
    )
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
