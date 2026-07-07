import "../config/env.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";

const GENERATED_IMAGE_PATH = "generated-product-images/littlesprout-romper.png";
const GENERATED_FOLDER = "products/generated";
const CLOTHING_TITLE = "LittleSprout Cotton Baby Romper Set";

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

const khmerBackfills = [
  {
    title: "BloomCare Silicone Feeding Starter Set",
    titleKm: "ឈុតចាប់ផ្តើមបំបៅកូនស៊ីលីកូន BloomCare",
    descriptionKm:
      "ឈុតចាប់ផ្តើមស៊ីលីកូនសុវត្ថិភាពសម្រាប់អាហារ មានចានបឺត ស្លាបព្រាបណ្តុះបណ្តាលទន់ និងផ្នែកងាយកាន់ សម្រាប់អាហារដំបូងកាន់តែស្អាត។",
  },
  {
    title: "SoftSip Anti-Colic Baby Bottle Trio",
    titleKm: "ឈុតដបទារកប្រឆាំងខ្យល់ពោះ SoftSip ចំនួន 3",
    descriptionKm:
      "ឈុតដបទឹកដោះគោ 3 ដបគ្មាន BPA មានក្បាលដបទន់ប្រឆាំងខ្យល់ពោះ សញ្ញាវាស់ច្បាស់ និងមាត់ដបធំងាយសម្អាត។",
  },
  {
    title: "CloudSoft Hooded Baby Bath Towel",
    titleKm: "កន្សែងងូតទឹកទារកមានមួក CloudSoft",
    descriptionKm:
      "កន្សែងមានមួកស្រូបទឹកល្អ សម្រាប់ពេលងូតទឹកទារកទើបកើត និងកុមារតូច មានអារម្មណ៍ទន់ដូចកប្បាស និងមួកត្រចៀកសត្វកក់ក្តៅ។",
  },
  {
    title: "PureNest Daily Baby Lotion & Wash Duo",
    titleKm: "ឈុតឡូសិន និងសាប៊ូងូតទឹកទារកប្រចាំថ្ងៃ PureNest",
    descriptionKm:
      "ឈុតថែរក្សាស្បែកប្រចាំថ្ងៃទន់ភ្លន់សម្រាប់ស្បែកទារកដ៏ប្រណិត រួមមានឡូសិនផ្តល់សំណើម និងសាប៊ូងូតទឹកមិនធ្វើឱ្យរលាកភ្នែក។",
  },
  {
    title: "DryCloud Overnight Baby Diapers",
    titleKm: "ខោទឹកនោមទារកពេលយប់ DryCloud",
    descriptionKm:
      "ខោទឹកនោមពេលយប់ទន់ មានស្រទាប់ដកដង្ហើមបាន ស្រូបលឿន និងការពារលេចធ្លាយ ដើម្បីឱ្យទារកគេងស្រួល។",
  },
  {
    title: "GoNest Compact Travel Stroller",
    titleKm: "រទេះរុញទារកធ្វើដំណើរបត់បាន GoNest",
    descriptionKm:
      "រទេះរុញទម្ងន់ស្រាលបត់បាន មានកៅអីទន់ ដំបូលកែតម្រូវបាន ខ្សែក្រវាត់សុវត្ថិភាព និងការរុញរលូនសម្រាប់ប្រើប្រចាំថ្ងៃ។",
  },
  {
    title: "TinyStep Soft Sole First Walker Shoes",
    titleKm: "ស្បែកជើងបាតទន់សម្រាប់ជំហានដំបូង TinyStep",
    descriptionKm:
      "ស្បែកជើងសម្រាប់ក្មេងចាប់ផ្តើមដើរ មានបាតទន់ បន្ទះទ្រនាប់ស្រួល និងភាពបត់បែន ជួយគាំទ្រការវារ ការឈរ និងជំហានដំបូង។",
  },
  {
    title: "CozyNest Bedside Baby Bassinet",
    titleKm: "គ្រែទារកក្បែរគ្រែ CozyNest",
    descriptionKm:
      "គ្រែទារកក្បែរគ្រែកែតម្រូវបាន មានបន្ទះសំណាញ់ដកដង្ហើមបាន ផ្ទៃគេងទន់ និងកន្ត្រកផ្ទុកខាងក្រោម។",
  },
];

const buildSizeStocks = () => {
  const stockBySize = {
    NB: 4,
    "0-3M": 5,
    "3-6M": 5,
    "6-9M": 4,
    "9-12M": 4,
    "12-18M": 3,
    "18-24M": 3,
    "2T": 2,
    "3T": 2,
    "4T": 2,
  };

  return BABY_CLOTHING_SIZES.map((size) => ({
    size,
    color: "",
    stock: stockBySize[size] || 0,
    reservedStock: 0,
  }));
};

const uploadGeneratedImage = async () => {
  const result = await cloudinary.uploader.upload(GENERATED_IMAGE_PATH, {
    folder: GENERATED_FOLDER,
    resource_type: "image",
  });

  return result.secure_url;
};

const backfillKhmerFields = async () => {
  let updatedCount = 0;

  for (const backfill of khmerBackfills) {
    const result = await Product.updateOne(
      {
        title: backfill.title,
        $or: [{ titleKm: "" }, { titleKm: { $exists: false } }, { descriptionKm: "" }, { descriptionKm: { $exists: false } }],
      },
      {
        $set: {
          titleKm: backfill.titleKm,
          descriptionKm: backfill.descriptionKm,
        },
      }
    );

    updatedCount += result.modifiedCount || 0;
  }

  return updatedCount;
};

const createClothingProduct = async () => {
  const existingProduct = await Product.findOne({ title: CLOTHING_TITLE });
  if (existingProduct) {
    return { created: false, product: existingProduct };
  }

  const image = await uploadGeneratedImage();
  const sizeStocks = buildSizeStocks();
  const stock = sizeStocks.reduce((sum, entry) => sum + entry.stock, 0);

  const product = await Product.create({
    title: CLOTHING_TITLE,
    titleKm: "ឈុត Romper កប្បាសទារក LittleSprout",
    price: 16.99,
    discountPrice: null,
    category: "Clothing",
    image,
    description:
      "Soft ribbed cotton romper set with a matching cap, gentle snap buttons, and breathable fabric for comfortable daily wear.",
    descriptionKm:
      "ឈុត romper កប្បាសទន់មានមួកផ្គូផ្គង ប៊ូតុងងាយបិទបើក និងក្រណាត់ដកដង្ហើមបាន សម្រាប់ការពាក់ប្រចាំថ្ងៃយ៉ាងស្រួល។",
    stock,
    reservedStock: 0,
    sizes: BABY_CLOTHING_SIZES,
    colors: [],
    colorImages: [],
    productDetailImages: [],
    sizeStocks,
    totalSold: 0,
    isNewArrival: true,
    hasProductIssue: false,
    issueQuantity: 0,
    expiryDate: null,
    rating: 0,
    numReviews: 0,
  });

  return { created: true, product };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const khmerUpdatedCount = await backfillKhmerFields();
  const { created, product } = await createClothingProduct();

  console.log(
    JSON.stringify(
      {
        khmerUpdatedCount,
        clothingProduct: {
          created,
          id: product._id.toString(),
          title: product.title,
          image: product.image,
          stock: product.stock,
          sizes: product.sizes,
        },
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
