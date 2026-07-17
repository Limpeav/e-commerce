import "../config/env.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

const PRODUCT_TITLE = "StarTrim Baby Collared Cotton Shirt";
const GENERATED_FOLDER = "products/generated/baby-collar-shirt";
const ASSET_DIR = "generated-product-images/baby-collar-shirt";

const BABY_CLOTHING_SIZES = [
  "NB",
  "0-3M",
  "3-6M",
  "6-9M",
  "9-12M",
  "12-18M",
  "18-24M",
  "2T",
  "3T",
  "4T",
];

const colorAssets = [
  { color: "Sky Blue", path: `${ASSET_DIR}/sky-blue.png` },
  { color: "Blush Pink", path: `${ASSET_DIR}/blush-pink.png` },
  { color: "Warm Cream", path: `${ASSET_DIR}/warm-cream.png` },
];

const detailAssetsByColor = [
  {
    color: "Sky Blue",
    assets: [
      `${ASSET_DIR}/collar-detail.png`,
      `${ASSET_DIR}/sleeve-detail.png`,
      `${ASSET_DIR}/button-detail.png`,
      `${ASSET_DIR}/embroidery-detail.png`,
      `${ASSET_DIR}/sky-blue-backside.png`,
    ],
  },
  {
    color: "Blush Pink",
    assets: [
      `${ASSET_DIR}/blush-pink-collar-detail.png`,
      `${ASSET_DIR}/blush-pink-button-detail.png`,
      `${ASSET_DIR}/blush-pink-embroidery-detail.png`,
      `${ASSET_DIR}/blush-pink-backside.png`,
    ],
  },
  {
    color: "Warm Cream",
    assets: [
      `${ASSET_DIR}/warm-cream-collar-detail.png`,
      `${ASSET_DIR}/warm-cream-sleeve-detail.png`,
      `${ASSET_DIR}/warm-cream-button-detail.png`,
      `${ASSET_DIR}/warm-cream-hem-detail.png`,
      `${ASSET_DIR}/warm-cream-backside.png`,
    ],
  },
];

const stockBySize = {
  NB: 3,
  "0-3M": 4,
  "3-6M": 5,
  "6-9M": 5,
  "9-12M": 4,
  "12-18M": 4,
  "18-24M": 3,
  "2T": 2,
  "3T": 2,
  "4T": 2,
};

const uploadImage = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: GENERATED_FOLDER,
    resource_type: "image",
  });

  return result.secure_url;
};

const buildSizeStocks = (colors) =>
  BABY_CLOTHING_SIZES.flatMap((size) =>
    colors.map((color) => ({
      size,
      color,
      stock: stockBySize[size] || 0,
      reservedStock: 0,
    }))
  );

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const colorImages = [];
  for (const asset of colorAssets) {
    colorImages.push({
      color: asset.color,
      image: await uploadImage(asset.path),
    });
  }

  const productDetailImages = [];
  for (const detailGroup of detailAssetsByColor) {
    const images = [];
    for (const assetPath of detailGroup.assets) {
      images.push(await uploadImage(assetPath));
    }
    productDetailImages.push({
      color: detailGroup.color,
      images,
    });
  }

  const colors = colorAssets.map((asset) => asset.color);
  const sizeStocks = buildSizeStocks(colors);
  const stock = sizeStocks.reduce((sum, entry) => sum + entry.stock, 0);

  const productPayload = {
    title: PRODUCT_TITLE,
    titleKm: "អាវកប្បាសកអាវសម្រាប់ទារក StarTrim",
    price: 13.99,
    discountPrice: null,
    category: "Clothing",
    image: colorImages[0].image,
    description:
      "Soft short-sleeve baby collared cotton shirt with ribbed collar, tidy sleeve cuffs, two-button placket, embroidered chest star, reinforced hem, and breathable pique fabric.",
    descriptionKm:
      "អាវកប្បាសកអាវដៃខ្លីទន់សម្រាប់ទារក មានកអាវ ribbed ចុងដៃស្អាត បន្ទះប៊ូតុងពីរ ប៉ាក់ផ្កាយលើទ្រូង គែមដេររឹងមាំ និងក្រណាត់ pique ដកដង្ហើមបាន។",
    stock,
    reservedStock: 0,
    sizes: BABY_CLOTHING_SIZES,
    colors,
    colorImages,
    productDetailImages,
    sizeStocks,
    totalSold: 0,
    isNewArrival: true,
    hasProductIssue: false,
    issueQuantity: 0,
    expiryDate: null,
    rating: 0,
    numReviews: 0,
  };

  const existingProduct = await Product.findOne({ title: PRODUCT_TITLE });
  const product = existingProduct
    ? await Product.findByIdAndUpdate(existingProduct._id, productPayload, {
        new: true,
        runValidators: true,
      })
    : await Product.create(productPayload);

  console.log(
    JSON.stringify(
      {
        created: !existingProduct,
        updated: Boolean(existingProduct),
        id: product._id.toString(),
        title: product.title,
        image: product.image,
        colors: product.colors,
        detailGroups: product.productDetailImages.map((entry) => ({
          color: entry.color,
          count: entry.images.length,
        })),
        stock: product.stock,
        sizeStockCount: product.sizeStocks.length,
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
