import "../config/env.js";
import mongoose from "mongoose";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

const PRODUCT_ID = "6a02cd8e856b4a1f0f0c474c";
const PRODUCT_TITLE = "BabyJoy Premium Travel Baby Stroller";
const GENERATED_FOLDER = "products/generated/babyjoy-premium-travel-stroller";
const ASSET_DIR = "generated-product-images/stroller-color-variants";

const variantAssets = [
  {
    color: "Slate Blue",
    image: `${ASSET_DIR}/stroller-slate-blue.png`,
    details: [
      `${ASSET_DIR}/stroller-slate-blue-canopy-detail.png`,
      `${ASSET_DIR}/stroller-slate-blue-harness-detail.png`,
      `${ASSET_DIR}/stroller-slate-blue-wheel-basket-detail.png`,
    ],
  },
  {
    color: "Mocha Brown",
    image: `${ASSET_DIR}/stroller-mocha-brown.png`,
    details: [
      `${ASSET_DIR}/stroller-mocha-brown-canopy-detail.png`,
      `${ASSET_DIR}/stroller-mocha-brown-harness-detail.png`,
      `${ASSET_DIR}/stroller-mocha-brown-wheel-basket-detail.png`,
    ],
  },
];

const uploadImage = async (filePath, subfolder) => {
  const publicId = path.basename(filePath, path.extname(filePath));
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `${GENERATED_FOLDER}/${subfolder}`,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });

  return result.secure_url;
};

const upsertByColor = (entries, color, value) => {
  const existingEntry = entries.find((entry) => entry.color === color);
  if (existingEntry) {
    Object.assign(existingEntry, value);
    return;
  }

  entries.push({ color, ...value });
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const product = await Product.findById(PRODUCT_ID);
  if (!product) {
    throw new Error(`Product not found: ${PRODUCT_ID}`);
  }

  if (product.title !== PRODUCT_TITLE) {
    throw new Error(
      `Product ID matched "${product.title}", expected "${PRODUCT_TITLE}"`
    );
  }

  const colors = new Set(product.colors || []);
  product.colorImages = product.colorImages || [];
  product.productDetailImages = product.productDetailImages || [];

  for (const variant of variantAssets) {
    colors.add(variant.color);

    const colorImageUrl = await uploadImage(variant.image, "colors");
    upsertByColor(product.colorImages, variant.color, {
      image: colorImageUrl,
    });

    const detailImageUrls = [];
    for (const assetPath of variant.details) {
      detailImageUrls.push(await uploadImage(assetPath, "details"));
    }

    upsertByColor(product.productDetailImages, variant.color, {
      images: detailImageUrls,
    });
  }

  product.colors = Array.from(colors);
  await product.save();

  console.log(
    JSON.stringify(
      {
        updated: true,
        id: product._id.toString(),
        title: product.title,
        colors: product.colors,
        colorImages: product.colorImages.map((entry) => entry.color),
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
