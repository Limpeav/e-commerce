import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import {
  COLOR_ONLY_STOCK_SIZE,
  adjustProductInventory,
  getAvailableStock,
  hasSizeStock,
} from "../utils/productInventory.js";
import {
  getProductColors,
  getProductImageForColor,
  getProductSizes,
  normalizeSelectedSize,
} from "../utils/productOptions.js";
import { classifyReviewSentiment } from "../utils/sentiment.js";

const DEFAULT_PASSWORD = "Customer@12345";
const SEED_DATE = "2026-08-01";
const PREFERRED_DELIVERY_PROOF_PUBLIC_ID =
  "delivery-proofs/s5vgyjvxf5t7pd2urpok";

const khmerCustomers = [
  {
    key: "dara-soklang",
    name: "Dara Sok Lang",
    email: "dara.soklang88@gmail.com",
    previousEmails: ["seed.khmer.dara.soklang@example.com"],
    phone: "+85512345700",
    address: "ផ្ទះលេខ 11 ផ្លូវ 2004 សង្កាត់កាកាបទី 1",
    city: "ភ្នំពេញ",
  },
  {
    key: "sopheak",
    name: "Duong Sopheak",
    email: "duong.sopheak95@gmail.com",
    previousEmails: ["seed.khmer.duong.sopheak@example.com"],
    phone: "+85512345701",
    address: "ផ្ទះលេខ 28 ផ្លូវ 271 សង្កាត់ទឹកថ្លា",
    city: "ភ្នំពេញ",
  },
  {
    key: "socheata",
    name: "Hean Socheata",
    email: "hean.socheata92@gmail.com",
    previousEmails: ["seed.khmer.hean.socheata@example.com"],
    phone: "+85512345702",
    address: "ភូមិព្រែកហូរ សង្កាត់ព្រែកហូរ",
    city: "កណ្ដាល",
  },
  {
    key: "monynath",
    name: "Keo Monynath",
    email: "keo.monynath91@gmail.com",
    previousEmails: ["seed.khmer.keo.monynath@example.com"],
    phone: "+85512345703",
    address: "ផ្ទះលេខ 63 ផ្លូវ 310 សង្កាត់បឹងកេងកងទី 3",
    city: "ភ្នំពេញ",
  },
  {
    key: "vannak",
    name: "Ly Vannak",
    email: "ly.vannak90@gmail.com",
    previousEmails: ["seed.khmer.ly.vannak@example.com"],
    phone: "+85512345704",
    address: "ផ្ទះលេខ 19 ផ្លូវជាតិលេខ 6 សង្កាត់ជ្រោយចង្វារ",
    city: "ភ្នំពេញ",
  },
  {
    key: "somaly",
    name: "Srey Somaly",
    email: "srey.somaly94@gmail.com",
    previousEmails: ["seed.khmer.srey.somaly@example.com"],
    phone: "+85512345705",
    address: "ផ្ទះលេខ 45 ផ្លូវ 7 មករា សង្កាត់ស្វាយដង្គំ",
    city: "សៀមរាប",
  },
  {
    key: "piseth",
    name: "Chhay Piseth",
    email: "chhay.piseth89@gmail.com",
    previousEmails: ["seed.khmer.chhay.piseth@example.com"],
    phone: "+85512345706",
    address: "ផ្ទះលេខ 22 ផ្លូវលេខ 3 សង្កាត់ស្វាយប៉ោ",
    city: "បាត់ដំបង",
  },
  {
    key: "leakena",
    name: "Pon Leakena",
    email: "pon.leakena96@gmail.com",
    previousEmails: ["seed.khmer.pon.leakena@example.com"],
    phone: "+85512345707",
    address: "ផ្ទះលេខ 8 ផ្លូវឯករាជ្យ សង្កាត់លេខ 4",
    city: "ព្រះសីហនុ",
  },
  {
    key: "ratanak",
    name: "Nhem Ratanak",
    email: "nhem.ratanak93@gmail.com",
    previousEmails: ["seed.khmer.nhem.ratanak@example.com"],
    phone: "+85512345708",
    address: "ភូមិអូរឬស្សី សង្កាត់អូរឬស្សី",
    city: "កំពង់ចាម",
  },
  {
    key: "bopha",
    name: "Meas Bopha",
    email: "meas.bopha97@gmail.com",
    previousEmails: ["seed.khmer.meas.bopha@example.com"],
    phone: "+85512345709",
    address: "ផ្ទះលេខ 37 ផ្លូវលេខ 2 សង្កាត់កំពង់កណ្ដាល",
    city: "កំពត",
  },
  {
    key: "chantha",
    name: "Sok Chantha",
    email: "sok.chantha86@gmail.com",
    phone: "+85512345710",
    address: "ផ្ទះលេខ 14 ផ្លូវ 182 សង្កាត់វាលវង់",
    city: "ភ្នំពេញ",
  },
  {
    key: "seila",
    name: "Kim Seila",
    email: "kim.seila91@gmail.com",
    phone: "+85512345711",
    address: "ផ្ទះលេខ 39 ផ្លូវ 456 សង្កាត់ទួលទំពូងទី 1",
    city: "ភ្នំពេញ",
  },
  {
    key: "sreyneang",
    name: "Vong Sreyneang",
    email: "vong.sreyneang94@gmail.com",
    phone: "+85512345712",
    address: "ផ្ទះលេខ 52 ផ្លូវ 1019 សង្កាត់ភ្នំពេញថ្មី",
    city: "ភ្នំពេញ",
  },
  {
    key: "sovath",
    name: "Long Sovath",
    email: "long.sovath88@gmail.com",
    phone: "+85512345713",
    address: "ភូមិដើមមៀន សង្កាត់ដើមមៀន",
    city: "កណ្ដាល",
  },
  {
    key: "makara",
    name: "Pich Makara",
    email: "pich.makara92@gmail.com",
    phone: "+85512345714",
    address: "ផ្ទះលេខ 26 ផ្លូវលេខ 5 សង្កាត់ចំការសំរោង",
    city: "បាត់ដំបង",
  },
  {
    key: "sreypov",
    name: "Ros Sreypov",
    email: "ros.sreypov95@gmail.com",
    phone: "+85512345715",
    address: "ផ្ទះលេខ 17 ផ្លូវវត្តបូព៌ សង្កាត់សាលាកំរើក",
    city: "សៀមរាប",
  },
  {
    key: "sambath",
    name: "Heng Sambath",
    email: "heng.sambath87@gmail.com",
    phone: "+85512345716",
    address: "ផ្ទះលេខ 61 ផ្លូវសម្តេចសង្ឃទេព វង្ស",
    city: "កំពង់ចាម",
  },
  {
    key: "sopanha",
    name: "Chea Sopanha",
    email: "chea.sopanha93@gmail.com",
    phone: "+85512345717",
    address: "ផ្ទះលេខ 33 ផ្លូវលេខ 4 សង្កាត់កំពង់កណ្ដាល",
    city: "កំពត",
  },
  {
    key: "sophal",
    name: "Mao Sophal",
    email: "mao.sophal89@gmail.com",
    phone: "+85512345718",
    address: "ផ្ទះលេខ 72 ផ្លូវឯករាជ្យ សង្កាត់លេខ 2",
    city: "ព្រះសីហនុ",
  },
  {
    key: "sokchea",
    name: "Yim Sokchea",
    email: "yim.sokchea90@gmail.com",
    phone: "+85512345719",
    address: "ភូមិត្រពាំងច្រេស ឃុំព្រៃស្លឹក",
    city: "តាកែវ",
  },
  {
    key: "kanika",
    name: "Ouk Kanika",
    email: "ouk.kanika96@gmail.com",
    phone: "+85512345720",
    address: "ផ្ទះលេខ 44 ផ្លូវជាតិលេខ 1 សង្កាត់និរោធ",
    city: "ភ្នំពេញ",
  },
  {
    key: "chenda",
    name: "Phan Chenda",
    email: "phan.chenda92@gmail.com",
    phone: "+85512345721",
    address: "ផ្ទះលេខ 29 ផ្លូវ 360 សង្កាត់បឹងកេងកងទី 3",
    city: "ភ្នំពេញ",
  },
  {
    key: "sokunthea",
    name: "Rin Sokunthea",
    email: "rin.sokunthea94@gmail.com",
    phone: "+85512345722",
    address: "ភូមិកំពង់ព្រះ ឃុំកំពង់ព្រះ",
    city: "បាត់ដំបង",
  },
  {
    key: "visoth",
    name: "Nov Visoth",
    email: "nov.visoth88@gmail.com",
    phone: "+85512345723",
    address: "ផ្ទះលេខ 18 ផ្លូវ 60 ម៉ែត្រ សង្កាត់ចាក់អង្រែលើ",
    city: "ភ្នំពេញ",
  },
  {
    key: "lina",
    name: "San Lina",
    email: "san.lina97@gmail.com",
    phone: "+85512345724",
    address: "ផ្ទះលេខ 58 ផ្លូវលេខ 6 សង្កាត់ស្រង៉ែ",
    city: "សៀមរាប",
  },
  {
    key: "borey",
    name: "Touch Borey",
    email: "touch.borey91@gmail.com",
    phone: "+85512345725",
    address: "ផ្ទះលេខ 21 ផ្លូវលេខ 7 សង្កាត់វាលវង់",
    city: "កំពង់ចាម",
  },
  {
    key: "sothea",
    name: "Em Sothea",
    email: "em.sothea90@gmail.com",
    phone: "+85512345726",
    address: "ភូមិអូរតាសេក សង្កាត់អូរតាសេក",
    city: "កំពង់ស្ពឺ",
  },
  {
    key: "sreylin",
    name: "Mom Sreylin",
    email: "mom.sreylin95@gmail.com",
    phone: "+85512345727",
    address: "ផ្ទះលេខ 36 ផ្លូវលេខ 2 សង្កាត់ស្វាយដង្គំ",
    city: "សៀមរាប",
  },
  {
    key: "vireak",
    name: "Sin Vireak",
    email: "sin.vireak87@gmail.com",
    phone: "+85512345728",
    address: "ផ្ទះលេខ 12 ផ្លូវជាតិលេខ 4 សង្កាត់លេខ 1",
    city: "ព្រះសីហនុ",
  },
  {
    key: "malis",
    name: "Tep Malis",
    email: "tep.malis96@gmail.com",
    phone: "+85512345729",
    address: "ផ្ទះលេខ 68 ផ្លូវ 598 សង្កាត់បឹងកក់ទី 2",
    city: "ភ្នំពេញ",
  },
  {
    key: "sovichea",
    name: "Kong Sovichea",
    email: "kong.sovichea89@gmail.com",
    phone: "+85512345730",
    address: "ផ្ទះលេខ 10 ផ្លូវ 430 សង្កាត់ទំនប់ទឹក",
    city: "ភ្នំពេញ",
    orderItemCount: 5,
  },
  {
    key: "rithy",
    name: "Sam Rithy",
    email: "sam.rithy92@gmail.com",
    phone: "+85512345731",
    address: "ផ្ទះលេខ 47 ផ្លូវ 1986 សង្កាត់ភ្នំពេញថ្មី",
    city: "ភ្នំពេញ",
    orderItemCount: 5,
  },
  {
    key: "sopheary",
    name: "Lim Sopheary",
    email: "lim.sopheary95@gmail.com",
    phone: "+85512345732",
    address: "ភូមិព្រែកឬស្សី សង្កាត់ព្រែកឬស្សី",
    city: "កណ្ដាល",
    orderItemCount: 5,
  },
  {
    key: "davy",
    name: "Hok Davy",
    email: "hok.davy90@gmail.com",
    phone: "+85512345733",
    address: "ផ្ទះលេខ 25 ផ្លូវលេខ 2 សង្កាត់រតនៈ",
    city: "បាត់ដំបង",
    orderItemCount: 5,
  },
  {
    key: "chandara",
    name: "Mey Chandara",
    email: "mey.chandara88@gmail.com",
    phone: "+85512345734",
    address: "ផ្ទះលេខ 41 ផ្លូវសាលាកំរើក សង្កាត់សាលាកំរើក",
    city: "សៀមរាប",
    orderItemCount: 5,
  },
  {
    key: "rothana",
    name: "Khem Rothana",
    email: "khem.rothana93@gmail.com",
    phone: "+85512345735",
    address: "ផ្ទះលេខ 66 ផ្លូវលេខ 7 សង្កាត់វាលវង់",
    city: "កំពង់ចាម",
    orderItemCount: 5,
  },
  {
    key: "sreymom",
    name: "Pen Sreymom",
    email: "pen.sreymom96@gmail.com",
    phone: "+85512345736",
    address: "ផ្ទះលេខ 34 ផ្លូវលេខ 3 សង្កាត់កំពង់កណ្ដាល",
    city: "កំពត",
    orderItemCount: 5,
  },
  {
    key: "narong",
    name: "Sorn Narong",
    email: "sorn.narong87@gmail.com",
    phone: "+85512345737",
    address: "ផ្ទះលេខ 15 ផ្លូវឯករាជ្យ សង្កាត់លេខ 3",
    city: "ព្រះសីហនុ",
    orderItemCount: 5,
  },
  {
    key: "nita",
    name: "Prak Nita",
    email: "prak.nita94@gmail.com",
    phone: "+85512345738",
    address: "ភូមិត្រពាំងសាប ឃុំត្រពាំងសាប",
    city: "តាកែវ",
    orderItemCount: 5,
  },
  {
    key: "bunthoeun",
    name: "Suon Bunthoeun",
    email: "suon.bunthoeun86@gmail.com",
    phone: "+85512345739",
    address: "ផ្ទះលេខ 73 ផ្លូវជាតិលេខ 5 សង្កាត់ព្រែកព្នៅ",
    city: "ភ្នំពេញ",
    orderItemCount: 5,
  },
  {
    key: "samnang",
    name: "Mean Samnang",
    email: "mean.samnang91@gmail.com",
    phone: "+85512345740",
    address: "ផ្ទះលេខ 20 ផ្លូវ 371 សង្កាត់បឹងទំពុនទី 2",
    city: "ភ្នំពេញ",
    orderItemCount: 5,
  },
  {
    key: "molika",
    name: "Lay Molika",
    email: "lay.molika97@gmail.com",
    phone: "+85512345741",
    address: "ផ្ទះលេខ 57 ផ្លូវ 2002 សង្កាត់ទឹកថ្លា",
    city: "ភ្នំពេញ",
    orderItemCount: 5,
  },
  {
    key: "channary",
    name: "Pov Channary",
    email: "pov.channary95@gmail.com",
    phone: "+85512345742",
    address: "ភូមិកំពង់សំណាញ់ សង្កាត់កំពង់សំណាញ់",
    city: "កណ្ដាល",
    orderItemCount: 5,
  },
  {
    key: "raksmey",
    name: "Neang Raksmey",
    email: "neang.raksmey92@gmail.com",
    phone: "+85512345743",
    address: "ផ្ទះលេខ 31 ផ្លូវលេខ 1 សង្កាត់ព្រែកព្រះស្តេច",
    city: "បាត់ដំបង",
    orderItemCount: 5,
  },
  {
    key: "darith",
    name: "Hun Darith",
    email: "hun.darith88@gmail.com",
    phone: "+85512345744",
    address: "ផ្ទះលេខ 49 ផ្លូវវត្តដំណាក់ សង្កាត់សាលាកំរើក",
    city: "សៀមរាប",
    orderItemCount: 5,
  },
  {
    key: "sreyka",
    name: "Thy Sreyka",
    email: "thy.sreyka96@gmail.com",
    phone: "+85512345745",
    address: "ផ្ទះលេខ 12 ផ្លូវលេខ 6 សង្កាត់បឹងកុក",
    city: "កំពង់ចាម",
    orderItemCount: 5,
  },
  {
    key: "sokheng",
    name: "Un Sokheng",
    email: "un.sokheng90@gmail.com",
    phone: "+85512345746",
    address: "ផ្ទះលេខ 23 ផ្លូវលេខ 4 សង្កាត់ក្រាំងអំពិល",
    city: "កំពត",
    orderItemCount: 5,
  },
  {
    key: "kimly",
    name: "Pou Kimly",
    email: "pou.kimly93@gmail.com",
    phone: "+85512345747",
    address: "ផ្ទះលេខ 55 ផ្លូវជាតិលេខ 4 សង្កាត់លេខ 1",
    city: "ព្រះសីហនុ",
    orderItemCount: 5,
  },
  {
    key: "virakboth",
    name: "Chum Virakboth",
    email: "chum.virakboth87@gmail.com",
    phone: "+85512345748",
    address: "ភូមិព្រៃឈរ ឃុំព្រៃឈរ",
    city: "កំពង់ស្ពឺ",
    orderItemCount: 5,
  },
  {
    key: "chanmony",
    name: "Yos Chanmony",
    email: "yos.chanmony94@gmail.com",
    phone: "+85512345749",
    address: "ផ្ទះលេខ 80 ផ្លូវ 598 សង្កាត់បឹងកក់ទី 2",
    city: "ភ្នំពេញ",
    orderItemCount: 5,
  },
];

const getOrderItemCount = (userIndex) =>
  khmerCustomers[userIndex]?.orderItemCount || 3 + (userIndex % 3);
const fallbackRatingPattern = [5, 4, 3, 2, 5, 4, 3, 4, 2, 5];

const getEffectivePrice = (product) => {
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

const syncProductReviewStats = (product) => {
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.length
    ? product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      product.reviews.length
    : 0;
};

const getProductLabel = (product) =>
  String(product?.titleKm || product?.title || "ផលិតផលនេះ").trim();

const getRatingForProduct = (product, userIndex, itemIndex) => {
  const baseRating =
    fallbackRatingPattern[
      (userIndex * 2 + itemIndex) % fallbackRatingPattern.length
    ];

  if (product?.hasProductIssue) {
    return Math.min(baseRating, 3);
  }

  return Math.max(2, Math.min(5, baseRating));
};

const getReviewComment = (product, rating) => {
  const label = getProductLabel(product);

  if (rating >= 5) {
    return `ខ្ញុំបានទិញ ${label} ហើយពេញចិត្តខ្លាំង។ គុណភាពល្អ ប្រើបានស្រួល និងការវេចខ្ចប់មកដល់ស្អាត។`;
  }

  if (rating === 4) {
    return `${label} ប្រើបានល្អ និងសាកសមនឹងតម្លៃ។ មានចំណុចតូចៗត្រូវកែលម្អ ប៉ុន្តែសរុបមកខ្ញុំពេញចិត្ត។`;
  }

  if (rating === 3) {
    return `${label} គុណភាពមធ្យម និងប្រើបានធម្មតា។ វាមានប្រយោជន៍ ប៉ុន្តែខ្ញុំរំពឹងថានឹងរឹងមាំ ឬងាយប្រើជាងនេះ។`;
  }

  return `ខ្ញុំបានសាកប្រើ ${label} ហើយវាប្រើបាន ប៉ុន្តែគុណភាពមិនសូវដូចការរំពឹង។ ខ្ញុំចង់ឱ្យកែលម្អសម្ភារៈ និងការប្រើប្រាស់។`;
};

const ensureUser = async (userSeed) => {
  const previousEmails = userSeed.previousEmails || [];
  let user = await User.findOne({ email: userSeed.email });

  if (user && user.phone && user.phone !== userSeed.phone) {
    throw new Error(
      `Email already belongs to another account: ${userSeed.email}`
    );
  }

  if (!user && previousEmails.length > 0) {
    user = await User.findOne({ email: { $in: previousEmails } });
  }

  if (!user) {
    user = new User({
      name: userSeed.name,
      email: userSeed.email,
      password: DEFAULT_PASSWORD,
      phone: userSeed.phone,
      role: "user",
      isAdmin: false,
      isVerified: true,
    });
    await user.save();
    return { user, created: true };
  }

  user.name = userSeed.name;
  user.email = userSeed.email;
  user.phone = userSeed.phone;
  user.role = "user";
  user.isAdmin = false;
  user.isVerified = true;
  await user.save();

  return { user, created: false };
};

const loadDeliveryProofs = async () => {
  const proofOrders = await Order.find({
    "deliveryProof.publicId": PREFERRED_DELIVERY_PROOF_PUBLIC_ID,
    "deliveryProof.imageUrl": { $exists: true, $ne: "" },
    "paymentResult.id": { $not: /^seed-khmer-10-customers-/ },
  })
    .select("deliveryProof")
    .lean();

  const proofs = proofOrders
    .map((order) => order.deliveryProof)
    .filter((proof) => proof?.imageUrl);

  if (proofs.length === 0) {
    throw new Error(
      `Preferred old delivery proof not found: ${PREFERRED_DELIVERY_PROOF_PUBLIC_ID}`
    );
  }

  return proofs;
};

const cloneDeliveryProof = (proofs, index, uploadedAt) => {
  const proof = proofs[index % proofs.length];
  const clonedProof = {
    imageUrl: proof.imageUrl,
    uploadedAt: proof.uploadedAt || uploadedAt,
    publicId: proof.publicId || "",
  };

  if (proof.uploadedBy) {
    clonedProof.uploadedBy = proof.uploadedBy;
  }

  return clonedProof;
};

const getVariantChoices = (product) => {
  if (hasSizeStock(product)) {
    return product.sizeStocks
      .map((entry) => {
        const normalizedSize = normalizeSelectedSize(entry?.size);
        const color = String(entry?.color || "").trim();
        const size =
          normalizedSize === COLOR_ONLY_STOCK_SIZE && color
            ? ""
            : normalizedSize;
        const available = getAvailableStock(product, size, color);

        return { product, size, color, remaining: available };
      })
      .filter((choice) => choice.remaining > 0);
  }

  const size = normalizeSelectedSize(getProductSizes(product)[0] || "");
  const color = getProductColors(product)[0] || "";
  const available = getAvailableStock(product, size, color);

  return available > 0 ? [{ product, size, color, remaining: available }] : [];
};

const loadAvailableProductChoices = async () => {
  const products = await Product.find({ stock: { $gt: 0 } })
    .sort({ totalSold: -1, createdAt: -1, _id: 1 })
    .limit(80);

  const choices = products.flatMap(getVariantChoices);

  if (choices.length === 0) {
    throw new Error("No available products found for seeded orders");
  }

  return choices;
};

const selectChoicesForOrder = (choices, itemCount, startIndex) => {
  const selected = [];
  const selectedProductIds = new Set();
  let cursor = startIndex % choices.length;
  let attempts = 0;

  while (selected.length < itemCount && attempts < choices.length * 3) {
    const choice = choices[cursor];
    const productId = choice.product._id.toString();

    if (choice.remaining > 0 && !selectedProductIds.has(productId)) {
      selected.push(choice);
      selectedProductIds.add(productId);
      choice.remaining -= 1;
    }

    cursor = (cursor + 1) % choices.length;
    attempts += 1;
  }

  if (selected.length < itemCount) {
    throw new Error(`Unable to select ${itemCount} unique products for an order`);
  }

  return selected;
};

const buildOrderItems = (choices) =>
  choices.map(({ product, size, color }) => ({
    product: product._id,
    name: product.title,
    titleKm: product.titleKm || "",
    quantity: 1,
    size,
    color,
    image: getProductImageForColor(product, color),
    price: getEffectivePrice(product),
  }));

const reducePurchasedStock = async (choices) => {
  for (const { product: selectedProduct, size, color } of choices) {
    const product = await Product.findById(selectedProduct._id);
    if (!product) {
      throw new Error(`Product not found while reducing stock: ${selectedProduct._id}`);
    }

    const availableStock = getAvailableStock(product, size, color);
    if (availableStock < 1) {
      throw new Error(
        `${product.title} only has ${availableStock} available for ${size || color || "standard"}`
      );
    }

    adjustProductInventory(product, {
      size,
      color,
      quantity: 1,
      action: "reduce",
    });
    product.totalSold = Number(product.totalSold || 0) + 1;
    await product.save();
  }
};

const ensureDeliveredOrder = async ({
  userSeed,
  user,
  userIndex,
  choices,
  deliveryProofs,
}) => {
  const orderKey = `seed-khmer-10-customers-${SEED_DATE}-${userSeed.key}`;
  const deliveredAt = new Date(Date.UTC(2026, 7, 1, 3 + userIndex, 0, 0));
  const existingOrder = await Order.findOne({ "paymentResult.id": orderKey });

  if (existingOrder) {
    existingOrder.shippingAddress.fullName = userSeed.name;
    existingOrder.shippingAddress.address = userSeed.address;
    existingOrder.shippingAddress.city = userSeed.city;
    existingOrder.shippingAddress.country = "Cambodia";
    existingOrder.shippingAddress.phone = userSeed.phone;
    existingOrder.paymentResult.email_address = user.email;
    existingOrder.deliveryProof = cloneDeliveryProof(
      deliveryProofs,
      userIndex,
      existingOrder.deliveredAt || deliveredAt
    );

    await existingOrder.save();
    return { order: existingOrder, created: false };
  }

  const orderItems = buildOrderItems(choices);
  const totalPrice = orderItems.reduce(
    (total, item) => total + Number(item.price || 0),
    0
  );

  const order = await Order.create({
    user: user._id,
    orderItems,
    shippingAddress: {
      fullName: userSeed.name,
      address: userSeed.address,
      city: userSeed.city,
      country: "Cambodia",
      phone: userSeed.phone,
    },
    paymentMethod: "Cash on Delivery",
    paymentResult: {
      id: orderKey,
      status: "Paid",
      update_time: deliveredAt.toISOString(),
      email_address: user.email,
    },
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice,
    orderStatus: "Delivered",
    paymentStatus: "Paid",
    isPaid: true,
    paidAt: deliveredAt,
    processedAt: deliveredAt,
    shippedAt: deliveredAt,
    isDelivered: true,
    deliveredAt,
    deliveryProof: cloneDeliveryProof(deliveryProofs, userIndex, deliveredAt),
    stockReduced: false,
    stockReserved: false,
    stockRestored: false,
  });

  await reducePurchasedStock(choices);
  order.stockReduced = true;
  await order.save();

  return { order, created: true };
};

const upsertReview = async ({ user, order, orderItem, userIndex, itemIndex }) => {
  const product = await Product.findById(orderItem.product);
  if (!product) {
    throw new Error(`Product not found for review: ${orderItem.product}`);
  }

  const rating = getRatingForProduct(product, userIndex, itemIndex);
  const comment = getReviewComment(product, rating);
  const sentiment = classifyReviewSentiment({ rating, comment });
  const analyzedAt = new Date();
  const existingReview = product.reviews.find(
    (review) => review.user.toString() === user._id.toString()
  );

  if (existingReview) {
    existingReview.name = user.name;
    existingReview.rating = rating;
    existingReview.comment = comment;
    existingReview.commentKm = comment;
    existingReview.sentimentLabel = sentiment.label;
    existingReview.sentimentScore = sentiment.score;
    existingReview.sentimentAnalyzedAt = analyzedAt;
    existingReview.order = order._id;
  } else {
    product.reviews.push({
      name: user.name,
      rating,
      comment,
      commentKm: comment,
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
      sentimentAnalyzedAt: analyzedAt,
      user: user._id,
      order: order._id,
    });
  }

  syncProductReviewStats(product);
  await product.save();

  return {
    productId: product._id.toString(),
    title: product.title,
    rating,
    updated: Boolean(existingReview),
  };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const deliveryProofs = await loadDeliveryProofs();
  const productChoices = await loadAvailableProductChoices();
  const summary = {
    users: [],
    orders: [],
    reviews: [],
    deliveryProofSourceCount: deliveryProofs.length,
    defaultPassword: DEFAULT_PASSWORD,
  };

  for (const [userIndex, userSeed] of khmerCustomers.entries()) {
    const { user, created: userCreated } = await ensureUser(userSeed);
    const existingOrder = await Order.findOne({
      "paymentResult.id": `seed-khmer-10-customers-${SEED_DATE}-${userSeed.key}`,
    });
    const choices = existingOrder
      ? []
      : selectChoicesForOrder(
          productChoices,
          getOrderItemCount(userIndex),
          userIndex * 5
        );

    const { order, created: orderCreated } = await ensureDeliveredOrder({
      userSeed,
      user,
      userIndex,
      choices,
      deliveryProofs,
    });

    summary.users.push({
      created: userCreated,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
    summary.orders.push({
      created: orderCreated,
      id: order._id.toString(),
      user: user.name,
      itemCount: order.orderItems.length,
      totalPrice: order.totalPrice,
      hasDeliveryProof: Boolean(order.deliveryProof?.imageUrl),
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
    });

    for (const [itemIndex, orderItem] of order.orderItems.entries()) {
      summary.reviews.push(
        await upsertReview({
          user,
          order,
          orderItem,
          userIndex,
          itemIndex,
        })
      );
    }
  }

  console.log(JSON.stringify(summary, null, 2));
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
