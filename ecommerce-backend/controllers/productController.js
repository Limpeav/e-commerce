import Product from "../models/Product.js";
import User from "../models/userModel.js";
import {
  classifyReviewSentiment,
  summarizeSentiment,
} from "../utils/sentiment.js";

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const sanitizeText = (value) => value?.toString().trim() || "";

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSort = (value = "latest") => {
  const sortMap = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    rating: { rating: -1 },
    "stock-desc": { stock: -1 },
  };
  return sortMap[value] || sortMap.latest;
};

const hasUploadConfigurationError = (req) => req.file && !req.file.path;

const sendUploadConfigurationError = (res) =>
  res.status(500).json({
    message:
      "Image upload is not configured. Set Cloudinary environment variables before uploading files.",
  });

const applyProductSearchFilters = (query = {}) => {
  const filter = {};

  const searchTerm = sanitizeText(query.q);
  if (searchTerm) {
    const safeRegex = new RegExp(escapeRegExp(searchTerm), "i");
    filter.$or = [
      { title: safeRegex },
      { description: safeRegex },
      { category: safeRegex },
      { brand: safeRegex },
      { type: safeRegex },
    ];
  }

  const category = sanitizeText(query.category);
  if (category) {
    filter.category = new RegExp(`^${escapeRegExp(category)}$`, "i");
  }

  const brand = sanitizeText(query.brand);
  if (brand) {
    filter.brand = new RegExp(`^${escapeRegExp(brand)}$`, "i");
  }

  const productType = sanitizeText(query.type);
  if (productType) {
    filter.type = new RegExp(`^${escapeRegExp(productType)}$`, "i");
  }

  const minPrice = parseOptionalNumber(query.minPrice);
  const maxPrice = parseOptionalNumber(query.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) {
      filter.price.$gte = minPrice;
    }
    if (maxPrice !== null) {
      filter.price.$lte = maxPrice;
    }
  }

  if (query.inStock === "true" || query.inStock === "1") {
    filter.stock = { $gt: 0 };
  }

  return filter;
};

const recalculateRating = (reviews = []) => {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return 0;
  }

  const total = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0);
  return total / reviews.length;
};

const recalculateSentimentSummary = (reviews = []) => summarizeSentiment(reviews);
const getReviewModerationStatus = (review) => review?.moderationStatus || "Approved";
const getApprovedReviews = (reviews = []) =>
  (Array.isArray(reviews) ? reviews : []).filter(
    (review) => getReviewModerationStatus(review) === "Approved"
  );

export const createProduct = async (req, res) => {
  try {
    if (hasUploadConfigurationError(req)) {
      return sendUploadConfigurationError(res);
    }

    const { title, price, discountPrice, category, brand, type, description, stock } =
      req.body;

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice)) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }

    const parsedStock = stock === undefined ? 0 : Number(stock);
    if (Number.isNaN(parsedStock)) {
      return res.status(400).json({ message: "Stock must be a valid number" });
    }

    const image = req.file?.path || req.body.image || "";
    if (!image) {
      return res.status(400).json({ message: "Product image is required" });
    }

    const product = new Product({
      title: sanitizeText(title),
      price: parsedPrice,
      discountPrice: parseOptionalNumber(discountPrice),
      category: sanitizeText(category),
      brand: sanitizeText(brand),
      type: sanitizeText(type),
      description: sanitizeText(description),
      stock: parsedStock,
      image,
      sentimentSummary: recalculateSentimentSummary([]),
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 100), 100);
    const skip = (page - 1) * limit;
    const withMeta = req.query.withMeta === "1" || req.query.withMeta === "true";

    const filter = applyProductSearchFilters(req.query);
    const sort = normalizeSort(req.query.sort);

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    if (!withMeta) {
      return res.json(products);
    }

    return res.json({
      items: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const category = sanitizeText(req.params.category);
    const products = await Product.find({
      category: new RegExp(`^${escapeRegExp(category)}$`, "i"),
    }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    const reviewUserIds = [...new Set(reviews.map((review) => review.user?.toString()))];
    const users = await User.find({ _id: { $in: reviewUserIds } }).select("_id name");
    const userNameMap = new Map(users.map((user) => [user._id.toString(), user.name]));

    const validReviews = [];
    const visibleReviews = [];
    let alreadyReviewed = false;
    let hasChanges = false;
    const isAdmin = req.user?.role === "admin";
    const currentUserId = req.user?._id?.toString();

    for (const review of reviews) {
      const userId = review.user?.toString();
      const currentUserName = userNameMap.get(userId);

      if (!currentUserName) {
        hasChanges = true;
        continue;
      }

      let sentimentLabel = review.sentimentLabel;
      let sentimentScore = Number(review.sentimentScore || 0);
      let moderationStatus = getReviewModerationStatus(review);
      if (!sentimentLabel) {
        const inferredSentiment = classifyReviewSentiment({
          rating: review.rating,
          comment: review.comment,
        });
        sentimentLabel = inferredSentiment.label;
        sentimentScore = inferredSentiment.score;
        hasChanges = true;
      }

      if (!review.moderationStatus) {
        hasChanges = true;
      }

      const updatedReview = {
        ...review.toObject(),
        name: currentUserName,
        sentimentLabel,
        sentimentScore,
        moderationStatus,
      };

      if (review.name !== currentUserName) {
        hasChanges = true;
      }

      if (req.user && userId === req.user._id.toString()) {
        alreadyReviewed = true;
      }

      validReviews.push(updatedReview);

      const canViewReview =
        moderationStatus === "Approved" || isAdmin || (currentUserId && userId === currentUserId);

      if (canViewReview) {
        visibleReviews.push(updatedReview);
      }
    }

    if (validReviews.length !== reviews.length) {
      hasChanges = true;
    }

    const approvedReviews = getApprovedReviews(validReviews);
    const nextRating = recalculateRating(approvedReviews);
    const nextSentimentSummary = recalculateSentimentSummary(approvedReviews);

    if (hasChanges) {
      product.reviews = validReviews;
      product.numReviews = approvedReviews.length;
      product.rating = nextRating;
      product.sentimentSummary = nextSentimentSummary;
      await product.save();
    }

    const productData = product.toObject();
    productData.alreadyReviewed = alreadyReviewed;
    productData.reviews = visibleReviews;
    productData.numReviews = approvedReviews.length;
    productData.rating = nextRating;
    productData.sentimentSummary = nextSentimentSummary;

    res.json(productData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    if (hasUploadConfigurationError(req)) {
      return sendUploadConfigurationError(res);
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.body.title !== undefined) {
      product.title = sanitizeText(req.body.title);
    }

    if (req.body.price !== undefined) {
      const parsedPrice = Number(req.body.price);
      if (Number.isNaN(parsedPrice)) {
        return res.status(400).json({ message: "Price must be a valid number" });
      }
      product.price = parsedPrice;
    }

    if (req.body.discountPrice !== undefined) {
      product.discountPrice = parseOptionalNumber(req.body.discountPrice);
    }

    if (req.body.category !== undefined) {
      product.category = sanitizeText(req.body.category);
    }

    if (req.body.brand !== undefined) {
      product.brand = sanitizeText(req.body.brand);
    }

    if (req.body.type !== undefined) {
      product.type = sanitizeText(req.body.type);
    }

    if (req.body.description !== undefined) {
      product.description = sanitizeText(req.body.description);
    }

    if (req.body.stock !== undefined) {
      const parsedStock = Number(req.body.stock);
      if (Number.isNaN(parsedStock)) {
        return res.status(400).json({ message: "Stock must be a valid number" });
      }
      product.stock = parsedStock;
    }

    if (req.file?.path) {
      product.image = req.file.path;
    } else if (req.body.image) {
      product.image = req.body.image;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed" });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const sentiment = classifyReviewSentiment({
      rating: numericRating,
      comment,
    });

    const review = {
      name: currentUser.name,
      rating: numericRating,
      comment: sanitizeText(comment),
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
      user: req.user._id,
      moderationStatus: "Pending",
      moderationNote: "",
    };

    product.reviews.push(review);
    const approvedReviews = getApprovedReviews(product.reviews);
    product.numReviews = approvedReviews.length;
    product.rating = recalculateRating(approvedReviews);
    product.sentimentSummary = recalculateSentimentSummary(approvedReviews);

    await product.save();
    res.status(201).json({
      message: "Review submitted and waiting for admin approval",
      sentiment: sentiment.label,
      moderationStatus: "Pending",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
