import "../config/env.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

const PRODUCT_TITLE = "CarryCloud 3-in-1 Baby Hip Seat Carrier";
const GENERATED_FOLDER = "products/generated/baby-hip-seat-carrier";
const ASSET_DIR = "generated-product-images/baby-hip-seat-carrier";

const colorAssets = [
  { color: "Sand Beige", path: `${ASSET_DIR}/sand-beige.png` },
  { color: "Charcoal Gray", path: `${ASSET_DIR}/charcoal-gray.png` },
  { color: "Forest Green", path: `${ASSET_DIR}/forest-green.png` },
];

const detailAssets = [
  `${ASSET_DIR}/shoulder-strap-detail.png`,
  `${ASSET_DIR}/safety-buckle-detail.png`,
  `${ASSET_DIR}/hip-seat-detail.png`,
  `${ASSET_DIR}/mesh-panel-detail.png`,
  `${ASSET_DIR}/storage-pocket-detail.png`,
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
    titleKm: "អៀវទារកមានកៅអីត្រគាក 3-in-1 CarryCloud",
    price: 54.99,
    discountPrice: 49.99,
    category: "Travel & Gear",
    image: colorImages[0].image,
    description:
      "Adjustable 3-in-1 baby carrier with padded shoulder straps, safety buckles, breathable mesh panel, structured hip seat cushion, and side storage pocket for daily travel.",
    descriptionKm:
      "អៀវទារក 3-in-1 កែតម្រូវបាន មានខ្សែស្មាទន់ ប៊ូតុងសុវត្ថិភាព បន្ទះសំណាញ់ដកដង្ហើមបាន កៅអីត្រគាកមានទ្រនាប់រឹងមាំ និងហោប៉ៅចំហៀងសម្រាប់ការធ្វើដំណើរប្រចាំថ្ងៃ។",
    stock: 18,
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
        detailGroups: product.productDetailImages.map((entry) => ({
          color: entry.color,
          count: entry.images.length,
        })),
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
