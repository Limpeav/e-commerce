import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import { adjustProductInventory, getAvailableStock } from "../utils/productInventory.js";
import {
  getProductImageForColor,
  normalizeSelectedSize,
} from "../utils/productOptions.js";
import { classifyReviewSentiment } from "../utils/sentiment.js";

const DEFAULT_PASSWORD = "Customer@12345";

const seededUsers = [
  {
    key: "sophea",
    name: "សុខ សុភា",
    email: "sok.sophea.customer@gmail.com",
    phone: "+85512345671",
    address: "ផ្ទះលេខ 12 ផ្លូវ 371 សង្កាត់បឹងទំពុន",
    city: "ភ្នំពេញ",
  },
  {
    key: "sreypich",
    name: "ចាន់ ស្រីពេជ្រ",
    email: "chan.sreypich.customer@gmail.com",
    phone: "+85512345672",
    address: "ផ្ទះលេខ 24 ផ្លូវ 2004 សង្កាត់កាកាប",
    city: "ភ្នំពេញ",
  },
  {
    key: "vannary",
    name: "ហេង វណ្ណារី",
    email: "heng.vannary.customer@gmail.com",
    phone: "+85512345673",
    address: "ភូមិតាខ្មៅ សង្កាត់តាខ្មៅ",
    city: "កណ្ដាល",
  },
];

const seededOrders = [
  {
    userKey: "sophea",
    orderKey: "seed-khmer-feedback-sophea-2026-07-25",
    items: [
      {
        productId: "6a631b80275e1ac507d2741f",
        quantity: 1,
        color: "Beige",
        rating: 5,
        comment:
          "គ្រែនេះរៀបចំបានលឿន ហើយមានកន្លែងផ្លាស់ប្តូរខោអាវងាយស្រួល។ ពណ៌ប៊ីសស្អាត និងសាកសមសម្រាប់បន្ទប់ទារក។",
      },
      {
        productId: "6a622820dfd62878fdf7148f",
        quantity: 2,
        rating: 4,
        comment:
          "ប្រដាប់ក្មេងលេងងូតទឹកទន់ និងងាយកាន់។ កូនខ្ញុំចូលចិត្តលេងពេលងូតទឹក ប៉ុន្តែចង់ឱ្យមានពណ៌ច្រើនជាងនេះបន្តិច។",
      },
    ],
  },
  {
    userKey: "sreypich",
    orderKey: "seed-khmer-feedback-sreypich-2026-07-25",
    items: [
      {
        productId: "6a6229f6dfd62878fdf715b1",
        quantity: 1,
        size: "6-9M",
        color: "Blue",
        rating: 5,
        comment:
          "ខោអាវគេងក្រណាត់ទន់ ស្រួលពាក់ និងមិនរឹតពេក។ បន្ទាប់ពីបោកក៏នៅតែរក្សារូបរាងល្អ។",
      },
      {
        productId: "6a62d4ac3ec9823c548e9ab5",
        quantity: 1,
        color: "White",
        rating: 4,
        comment:
          "តុប្តូរខោមានធ្នើផ្ទុកបានច្រើន និងមើលទៅរឹងមាំ។ កម្ពស់សមរម្យ សម្រាប់ប្រើរាល់ថ្ងៃនៅបន្ទប់ទារក។",
      },
    ],
  },
  {
    userKey: "vannary",
    orderKey: "seed-khmer-feedback-vannary-2026-07-25",
    items: [
      {
        productId: "6a622607dfd62878fdf71377",
        quantity: 1,
        rating: 3,
        comment:
          "កៅអីងូតទឹកជួយឱ្យកូនអង្គុយបានមានសុវត្ថិភាព។ ខ្នើយទន់ល្អ ប៉ុន្តែទំហំធំបន្តិចសម្រាប់អាងតូច។",
      },
      {
        productId: "6a61b5c0e565f9fb1bed0476",
        quantity: 1,
        rating: 5,
        comment:
          "ឈុតរថយន្តសំណង់នេះល្អណាស់ កង់រត់រលូន និងមានគ្រឿងច្រើន។ កូនខ្ញុំលេងបានយូរ និងសប្បាយខ្លាំង។",
      },
    ],
  },
  {
    userKey: "sophea",
    orderKey: "seed-khmer-feedback-sophea-round2-2026-07-25",
    items: [
      {
        productId: "6a61e2a3a42c00e8e4b9d285",
        quantity: 1,
        rating: 5,
        comment:
          "សាប៊ូ និងឡូសិននេះស្រាលលើស្បែកទារក មិនធ្វើឱ្យស្ងួត ហើយក្លិនទន់ស្រួល។ ប្រើក្រោយងូតទឹកស្បែកកូននៅតែទន់ល្អ។",
      },
    ],
  },
  {
    userKey: "sreypich",
    orderKey: "seed-khmer-feedback-sreypich-round2-2026-07-25",
    items: [
      {
        productId: "6a61cc6773eef08c316a3a34",
        quantity: 1,
        rating: 4,
        comment:
          "រថយន្តមានភ្លើង LED ស្អាត និងកង់រត់រលូន។ កូនខ្ញុំចូលចិត្តលេងពេលល្ងាច ប៉ុន្តែសំឡេងខ្លាំងបន្តិច។",
      },
    ],
  },
  {
    userKey: "vannary",
    orderKey: "seed-khmer-feedback-vannary-round2-2026-07-25",
    items: [
      {
        productId: "6a61e3aba42c00e8e4b9d388",
        quantity: 1,
        rating: 4,
        comment:
          "អាងងូតទឹកបត់បានងាយស្រួលទុក និងមានទែម៉ូម៉ែត្រជួយមើលសីតុណ្ហភាពទឹក។ ខ្នើយអណ្តែតទន់ ប៉ុន្តែពេលបើកប្រើត្រូវការកន្លែងបន្តិច។",
      },
    ],
  },
];

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

const ensureUser = async (userSeed) => {
  let user = await User.findOne({ email: userSeed.email });

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
  user.phone = userSeed.phone;
  user.role = "user";
  user.isAdmin = false;
  user.isVerified = true;
  await user.save();
  return { user, created: false };
};

const buildOrderItems = async (orderSeed) => {
  const items = [];
  const products = [];

  for (const itemSeed of orderSeed.items) {
    const product = await Product.findById(itemSeed.productId);
    if (!product) {
      throw new Error(`Product not found: ${itemSeed.productId}`);
    }

    const size = normalizeSelectedSize(itemSeed.size || "");
    const color = String(itemSeed.color || "").trim();
    const availableStock = getAvailableStock(product, size, color);
    if (availableStock < itemSeed.quantity) {
      throw new Error(
        `${product.title} only has ${availableStock} available for ${size || color || "standard"}`
      );
    }

    items.push({
      product: product._id,
      name: product.title,
      titleKm: product.titleKm || "",
      quantity: itemSeed.quantity,
      size,
      color,
      image: getProductImageForColor(product, color),
      price: getEffectivePrice(product),
    });
    products.push({ product, itemSeed, size, color });
  }

  return { items, products };
};

const reducePurchasedStock = async (products) => {
  for (const { product, itemSeed, size, color } of products) {
    adjustProductInventory(product, {
      size,
      color,
      quantity: itemSeed.quantity,
      action: "reduce",
    });
    product.totalSold = Number(product.totalSold || 0) + Number(itemSeed.quantity || 0);
    await product.save();
  }
};

const ensureDeliveredOrder = async (userSeed, user, orderSeed) => {
  const existingOrder = await Order.findOne({ "paymentResult.id": orderSeed.orderKey });
  if (existingOrder) {
    return { order: existingOrder, created: false };
  }

  const { items, products } = await buildOrderItems(orderSeed);
  const totalPrice = items.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const deliveredAt = new Date();

  const order = await Order.create({
    user: user._id,
    orderItems: items,
    shippingAddress: {
      fullName: userSeed.name,
      address: userSeed.address,
      city: userSeed.city,
      country: "Cambodia",
      phone: userSeed.phone,
    },
    paymentMethod: "Cash on Delivery",
    paymentResult: {
      id: orderSeed.orderKey,
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
    stockReduced: true,
    stockReserved: false,
    stockRestored: false,
  });

  await reducePurchasedStock(products);
  return { order, created: true };
};

const upsertReview = async ({ user, order, itemSeed }) => {
  const product = await Product.findById(itemSeed.productId);
  if (!product) {
    throw new Error(`Product not found for review: ${itemSeed.productId}`);
  }

  const rating = Math.max(3, Math.min(5, Number(itemSeed.rating || 5)));
  const sentiment = classifyReviewSentiment({ rating, comment: itemSeed.comment });
  const analyzedAt = new Date();
  const existingReview = product.reviews.find(
    (review) => review.user.toString() === user._id.toString()
  );

  if (existingReview) {
    existingReview.name = user.name;
    existingReview.rating = rating;
    existingReview.comment = itemSeed.comment;
    existingReview.commentKm = itemSeed.comment;
    existingReview.sentimentLabel = sentiment.label;
    existingReview.sentimentScore = sentiment.score;
    existingReview.sentimentAnalyzedAt = analyzedAt;
    existingReview.order = order._id;
  } else {
    product.reviews.push({
      name: user.name,
      rating,
      comment: itemSeed.comment,
      commentKm: itemSeed.comment,
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

  const usersByKey = new Map();
  const summary = {
    users: [],
    orders: [],
    reviews: [],
    defaultPassword: DEFAULT_PASSWORD,
  };

  for (const userSeed of seededUsers) {
    const { user, created } = await ensureUser(userSeed);
    usersByKey.set(userSeed.key, { userSeed, user });
    summary.users.push({
      created,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
  }

  for (const orderSeed of seededOrders) {
    const seededUser = usersByKey.get(orderSeed.userKey);
    if (!seededUser) {
      throw new Error(`Missing user seed for ${orderSeed.userKey}`);
    }

    const { order, created } = await ensureDeliveredOrder(
      seededUser.userSeed,
      seededUser.user,
      orderSeed
    );
    summary.orders.push({
      created,
      id: order._id.toString(),
      user: seededUser.user.name,
      itemCount: order.orderItems.length,
      totalPrice: order.totalPrice,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
    });

    for (const itemSeed of orderSeed.items) {
      summary.reviews.push(
        await upsertReview({
          user: seededUser.user,
          order,
          itemSeed,
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
