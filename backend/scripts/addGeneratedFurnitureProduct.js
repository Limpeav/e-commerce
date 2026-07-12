import "../config/env.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

const PRODUCT_TITLE = "RoundNest Nursery Storage Shelf";
const GENERATED_FOLDER = "products/generated/nursery-storage-shelf";
const ASSET_DIR = "generated-product-images/nursery-storage-shelf";

const colorAssets = [
  { color: "Natural Oak", path: `${ASSET_DIR}/natural-oak.png` },
  { color: "Soft White", path: `${ASSET_DIR}/soft-white.png` },
  { color: "Sage Green", path: `${ASSET_DIR}/sage-green.png` },
];

const detailAssets = [
  `${ASSET_DIR}/rounded-corner-detail.png`,
  `${ASSET_DIR}/drawer-knob-detail.png`,
  `${ASSET_DIR}/cubby-divider-detail.png`,
  `${ASSET_DIR}/rounded-leg-detail.png`,
  `${ASSET_DIR}/wood-finish-detail.png`,
];

const uploadImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: GENERATED_FOLDER,
    resource_type: "image",
  });

  return result.secure_url;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingProduct = await Product.findOne({ title: PRODUCT_TITLE });
  if (existingProduct) {
    console.log(
      JSON.stringify(
        {
          created: false,
          id: existingProduct._id.toString(),
          title: existingProduct.title,
          image: existingProduct.image,
        },
        null,
        2
      )
    );
    return;
  }

  const colorImages = [];
  for (const asset of colorAssets) {
    colorImages.push({
      color: asset.color,
      image: await uploadImage(asset.path),
    });
  }

  const detailImages = [];
  for (const assetPath of detailAssets) {
    detailImages.push(await uploadImage(assetPath));
  }

  const colors = colorAssets.map((asset) => asset.color);
  const product = await Product.create({
    title: PRODUCT_TITLE,
    titleKm: "ធ្នើផ្ទុកសម្ភារៈបន្ទប់ទារក RoundNest",
    price: 84.99,
    discountPrice: null,
    category: "Furniture",
    image: colorImages[0].image,
    description:
      "Compact nursery storage shelf with rounded safety corners, three open cubbies, a smooth lower drawer, sturdy rounded legs, and a child-safe matte finish.",
    descriptionKm:
      "ធ្នើផ្ទុកសម្ភារៈបន្ទប់ទារកទំហំតូច មានជ្រុងមូលសុវត្ថិភាព ប្រអប់បើកចំនួនបី ថតខាងក្រោមរលូន ជើងមូលរឹងមាំ និងថ្នាំលាបម៉ាត់សុវត្ថិភាពសម្រាប់កុមារ។",
    stock: 9,
    reservedStock: 0,
    sizes: [],
    colors,
    colorImages,
    productDetailImages: colors.map((color) => ({
      color,
      images: detailImages,
    })),
    sizeStocks: [],
    totalSold: 0,
    isNewArrival: true,
    hasProductIssue: false,
    issueQuantity: 0,
    expiryDate: null,
    rating: 0,
    numReviews: 0,
  });

  console.log(
    JSON.stringify(
      {
        created: true,
        id: product._id.toString(),
        title: product.title,
        image: product.image,
        colors: product.colors,
        detailImageCount: product.productDetailImages[0]?.images.length || 0,
        stock: product.stock,
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
