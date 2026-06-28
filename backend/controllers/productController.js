import axios from "axios";
import https from "https";
import Product from "../models/Product.js";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import {
  containsThaiScript,
  isAzureTranslatorConfigured,
  translateTextWithAzure,
} from "../utils/azureTranslation.js";
import { syncLowStockAlertFlag } from "../utils/stockAlerts.js";
import { sendStorePromotionEmail } from "../utils/sendEmail.js";
import {
  getProductCategoryLookupValues,
  isAllowedProductCategory,
  normalizeProductCategory,
} from "../utils/productCategories.js";
import { emitDomainChanged } from "../realtime/socket.js";
import {
  parseProductExpiryDate,
} from "../utils/productExpiry.js";
import {
  getAvailableStock,
  parseSizeStocksPayload,
  syncTotalStockFromSizes,
} from "../utils/productInventory.js";

const REQUIRED_CSV_COLUMNS = ["title", "price", "category", "image"];
const CSV_HEADER_ALIASES = {
  discountprice: "discountPrice",
  descriptionkm: "descriptionKm",
  isnewarrival: "isNewArrival",
  hasproductissue: "hasProductIssue",
  issuequantity: "issueQuantity",
  titlekm: "titleKm",
  expirydate: "expiryDate",
};

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(stringValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const parseBoolean = (value) =>
  value === true || value === "true" || value === "1" || value === 1;

const buildSizeStockData = (value) => {
  const sizeStocks = parseSizeStocksPayload(value);
  const sizes = sizeStocks.map((entry) => entry.size);
  const stock = sizeStocks.reduce(
    (total, entry) => total + Number(entry.stock || 0),
    0
  );

  return { sizeStocks, sizes, stock };
};

const PROMOTIONAL_EMAIL_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.PROMOTIONAL_EMAIL_CONCURRENCY || "2", 10) || 2
);
const PROMOTIONAL_EMAIL_BATCH_DELAY_MS = Math.max(
  0,
  Number.parseInt(process.env.PROMOTIONAL_EMAIL_BATCH_DELAY_MS || "1200", 10) || 1200
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getPromotionalEmailSubscribers = () =>
  User.find({
    role: "user",
    email: { $exists: true, $ne: "" },
    "notificationPreferences.promotionalEmails": { $ne: false },
  })
    .select("name email")
    .lean();

const notifyPromotionalEmailSubscribers = async ({
  discountRange,
  promotionCount,
  dealsUrl,
}) => {
  const subscribers = await getPromotionalEmailSubscribers();

  let sentCount = 0;
  let failedCount = 0;
  const failedRecipients = [];

  const sendToSubscriber = async (subscriber) => {
    try {
      await sendStorePromotionEmail({
        email: subscriber.email,
        customerName: subscriber.name,
        discountRange,
        promotionCount,
        dealsUrl,
      });
      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      failedRecipients.push({
        email: subscriber.email,
        reason: error.message || "Unknown email provider error",
      });
      console.error(`Failed to send promotional email to ${subscriber.email}:`, error.message);
    }
  };

  for (let index = 0; index < subscribers.length; index += PROMOTIONAL_EMAIL_CONCURRENCY) {
    const batch = subscribers.slice(index, index + PROMOTIONAL_EMAIL_CONCURRENCY);
    await Promise.all(batch.map(sendToSubscriber));

    const hasMoreSubscribers = index + PROMOTIONAL_EMAIL_CONCURRENCY < subscribers.length;
    if (hasMoreSubscribers && PROMOTIONAL_EMAIL_BATCH_DELAY_MS > 0) {
      await delay(PROMOTIONAL_EMAIL_BATCH_DELAY_MS);
    }
  }

  console.log(
    `Promotional email notification finished: ${sentCount} sent, ${failedCount} failed, ${subscribers.length} subscribers.`
  );

  return {
    sentCount,
    failedCount,
    recipientCount: subscribers.length,
    failedRecipients,
  };
};

let azureTranslationUnavailable = false;
let azureTranslationWarningLogged = false;
let fallbackTranslationWarningLogged = false;
const translationHttpsAgent = new https.Agent({ keepAlive: false });

const translateToKhmerWithGoogle = async (text = "") => {
  const response = await axios.get(
    "https://translate.googleapis.com/translate_a/single",
    {
      params: {
        client: "gtx",
        sl: "auto",
        tl: "km",
        dt: "t",
        q: text,
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      httpsAgent: translationHttpsAgent,
      timeout: 30000,
    }
  );

  return response.data?.[0]
    ?.map((segment) => segment?.[0] || "")
    .join("")
    .trim() || "";
};

const translateToKhmer = async (text = "") => {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    return "";
  }

  if (isAzureTranslatorConfigured() && !azureTranslationUnavailable) {
    try {
      const translatedText = await translateTextWithAzure({
        text: trimmedText,
        targetLanguage: "km",
        sourceLanguage: "auto",
      });

      if (translatedText && !containsThaiScript(translatedText)) {
        return translatedText;
      }

      if (containsThaiScript(translatedText)) {
        throw new Error("Azure Translator returned Thai script instead of Khmer script");
      }
    } catch (error) {
      if (!azureTranslationWarningLogged) {
        console.warn("Azure product Khmer translation failed:", error.message);
        azureTranslationWarningLogged = true;
      }
      if (error.response?.status === 429) {
        azureTranslationUnavailable = true;
      }
    }
  }

  try {
    return await translateToKhmerWithGoogle(trimmedText);
  } catch (error) {
    if (!fallbackTranslationWarningLogged) {
      console.warn("Fallback product Khmer translation failed:", error.message);
      fallbackTranslationWarningLogged = true;
    }
    return "";
  }
};

const productNeedsKhmerTranslation = (product) =>
  Boolean(
    (product.title && !product.titleKm) ||
    (product.description && !product.descriptionKm)
  );

const applyAutoKhmerTranslation = async (productData, existingProduct = {}) => {
  const titleChanged =
    !existingProduct.title || productData.title !== existingProduct.title;
  const descriptionChanged =
    !existingProduct.description ||
    productData.description !== existingProduct.description;

  const titleKm =
    productData.titleKm ||
    (!titleChanged
      ? existingProduct.titleKm || ""
      : await translateToKhmer(productData.title));

  const descriptionKm =
    productData.descriptionKm ||
    (!descriptionChanged
      ? existingProduct.descriptionKm || ""
      : await translateToKhmer(productData.description));

  return {
    ...productData,
    titleKm,
    descriptionKm,
  };
};

const parseSalesDateBoundary = (value, endOfDay = false) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  }

  return date;
};

const attachSalesMetrics = async (products, options = {}) => {
  const productDocs = Array.isArray(products) ? products : [products];
  const productIds = productDocs.map((product) => product._id);

  if (productIds.length === 0) {
    return products;
  }

  const orderMatch = {
    paymentStatus: "Paid",
    orderStatus: { $ne: "Cancelled" },
    "orderItems.product": { $in: productIds },
  };
  const salesStartDate = parseSalesDateBoundary(options.salesStartDate);
  const salesEndDate = parseSalesDateBoundary(options.salesEndDate, true);

  if (salesStartDate || salesEndDate) {
    orderMatch.createdAt = {};
    if (salesStartDate) orderMatch.createdAt.$gte = salesStartDate;
    if (salesEndDate) orderMatch.createdAt.$lte = salesEndDate;
  }

  const salesTotals = await Order.aggregate([
    {
      $match: orderMatch,
    },
    { $unwind: "$orderItems" },
    {
      $match: {
        "orderItems.product": { $in: productIds },
      },
    },
    {
      $group: {
        _id: "$orderItems.product",
        sold: { $sum: "$orderItems.quantity" },
        revenue: {
          $sum: {
            $multiply: ["$orderItems.quantity", "$orderItems.price"],
          },
        },
      },
    },
  ]);

  const salesByProductId = new Map(
    salesTotals.map((item) => [
      item._id.toString(),
      {
        sold: Number(item.sold || 0),
        revenue: Number(item.revenue || 0),
      },
    ])
  );

  const withMetrics = productDocs.map((product) => {
    const productData =
      typeof product.toObject === "function" ? product.toObject() : product;
    const paidSales = salesByProductId.get(productData._id.toString());
    const sold = paidSales?.sold || 0;
    const paidRevenue = paidSales?.revenue || 0;

    return {
      ...productData,
      category: normalizeProductCategory(productData.category),
      availableStock: getAvailableStock(productData),
      sold,
      totalSold: sold,
      paidRevenue,
      isBestSeller: false,
    };
  });

  const bestByCategory = new Map();

  withMetrics.forEach((product) => {
    if (Number(product.sold || 0) <= 0) return;

    const categoryKey = normalizeProductCategory(product.category).toLowerCase();
    const currentBest = bestByCategory.get(categoryKey);
    const soldDelta = Number(product.sold || 0) - Number(currentBest?.sold || 0);
    const revenueDelta =
      Number(product.paidRevenue || 0) - Number(currentBest?.paidRevenue || 0);
    const ratingDelta = Number(product.rating || 0) - Number(currentBest?.rating || 0);
    const createdDelta =
      new Date(product.createdAt || 0).getTime() -
      new Date(currentBest?.createdAt || 0).getTime();

    const isBetterTieBreak =
      soldDelta === 0 &&
      (revenueDelta > 0 ||
        (revenueDelta === 0 &&
          (ratingDelta > 0 || (ratingDelta === 0 && createdDelta > 0))));

    if (!currentBest || soldDelta > 0 || isBetterTieBreak) {
      bestByCategory.set(categoryKey, product);
    }
  });

  const bestSellerIds = new Set(
    [...bestByCategory.values()].map((product) => product._id.toString())
  );

  withMetrics.forEach((product) => {
    product.isBestSeller = bestSellerIds.has(product._id.toString());
  });

  return Array.isArray(products) ? withMetrics : withMetrics[0];
};

const normalizeCsvHeader = (header = "") => {
  const normalizedHeader = header
    .trim()
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\s_-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""));

  return CSV_HEADER_ALIASES[normalizedHeader] || normalizedHeader;
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const parseCsv = (content = "") => {
  const lines = content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(normalizeCsvHeader);
  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, columnIndex) => {
      row[header] = values[columnIndex] ?? "";
    });

    return {
      rowNumber: index + 2,
      data: row,
    };
  });

  return { headers, rows };
};

const validateAndBuildProductRow = ({ data, rowNumber }) => {
  const title = data.title?.trim();
  const titleKm = data.titleKm?.trim() || "";
  const category = normalizeProductCategory(data.category);
  const description = data.description?.trim() || "";
  const descriptionKm = data.descriptionKm?.trim() || "";
  const image = data.image?.trim();
  const price = Number.parseFloat(data.price);
  const discountPrice = data.discountPrice?.trim()
    ? Number.parseFloat(data.discountPrice)
    : null;
  const sizeStockData = buildSizeStockData(data.sizeStocks);
  const stock = sizeStockData.sizeStocks.length > 0
    ? sizeStockData.stock
    : data.stock?.trim() ? Number.parseInt(data.stock, 10) : 0;
  const isNewArrival = parseBoolean(data.isNewArrival);
  const hasProductIssue = parseBoolean(data.hasProductIssue);
  const issueQuantity = data.issueQuantity?.trim()
    ? Number.parseInt(data.issueQuantity, 10)
    : 0;
  const parsedExpiryDate = parseProductExpiryDate(data.expiryDate, category);

  if (!title) {
    return `Row ${rowNumber}: title is required`;
  }

  if (!Number.isFinite(price) || price < 0) {
    return `Row ${rowNumber}: price must be a valid non-negative number`;
  }

  if (!category) {
    return `Row ${rowNumber}: category is required`;
  }

  if (!isAllowedProductCategory(category)) {
    return `Row ${rowNumber}: category is no longer available`;
  }

  if (parsedExpiryDate.error) {
    return `Row ${rowNumber}: ${parsedExpiryDate.error}`;
  }

  if (!image) {
    return `Row ${rowNumber}: image is required and must be a URL`;
  }

  if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0)) {
    return `Row ${rowNumber}: discountPrice must be a valid non-negative number`;
  }

  if (
    discountPrice !== null &&
    Number.isFinite(discountPrice) &&
    discountPrice >= price
  ) {
    return `Row ${rowNumber}: discountPrice must be less than price`;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return `Row ${rowNumber}: stock must be a valid non-negative integer`;
  }

  if (!Number.isInteger(issueQuantity) || issueQuantity < 0) {
    return `Row ${rowNumber}: issueQuantity must be a valid non-negative integer`;
  }

  return {
    title,
    titleKm,
    price,
    discountPrice,
    category,
    description,
    descriptionKm,
    stock,
    sizes: sizeStockData.sizes,
    sizeStocks: sizeStockData.sizeStocks,
    image,
    isNewArrival,
    hasProductIssue,
    issueQuantity: hasProductIssue ? issueQuantity : 0,
    expiryDate: parsedExpiryDate.value,
  };
};

export const createProduct = async (req, res) => {
  try {
    const {
      title,
      price,
      discountPrice,
      category,
      description,
      stock,
      sizeStocks,
      isNewArrival,
      hasProductIssue,
      issueQuantity,
      expiryDate,
    } = req.body;
    const normalizedCategory = normalizeProductCategory(category);
    const parsedExpiryDate = parseProductExpiryDate(expiryDate, normalizedCategory);

    if (!isAllowedProductCategory(normalizedCategory)) {
      return res.status(400).json({ message: "Selected category is no longer available" });
    }

    if (parsedExpiryDate.error) {
      return res.status(400).json({ message: parsedExpiryDate.error });
    }

    const uploadedImageUrl = String(req.body.imageUrl || "").trim();

    if (!req.file?.path && !uploadedImageUrl) {
      return res.status(400).json({ message: "Product image is required" });
    }

    const sizeStockData = buildSizeStockData(sizeStocks);
    const submittedStock = sizeStockData.sizeStocks.length > 0
      ? sizeStockData.stock
      : Math.max(0, Number.parseInt(stock, 10) || 0);

    const productData = await applyAutoKhmerTranslation({
      title,
      price,
      discountPrice: parseOptionalNumber(discountPrice),
      category: normalizedCategory,
      description,
      stock: submittedStock,
      sizes: sizeStockData.sizes,
      sizeStocks: sizeStockData.sizeStocks,
      isNewArrival: parseBoolean(isNewArrival),
      hasProductIssue: parseBoolean(hasProductIssue),
      issueQuantity: parseBoolean(hasProductIssue)
        ? Math.max(0, Number.parseInt(issueQuantity, 10) || 0)
        : 0,
      expiryDate: parsedExpiryDate.value,
      image: req.file?.path || uploadedImageUrl,
    });

    const product = new Product(productData);
    syncTotalStockFromSizes(product);

    syncLowStockAlertFlag(product);
    const saved = await product.save();
    emitDomainChanged("products", "created", { productId: saved._id }, { users: true });
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sendStorePromotionEmailBlast = async (req, res) => {
  try {
    const promotionalProducts = await Product.find({
      stock: { $gt: 0 },
      discountPrice: { $gt: 0 },
      $expr: { $lt: ["$discountPrice", "$price"] },
    })
      .select("price discountPrice")
      .lean();
    const promotionCount = promotionalProducts.length;

    if (promotionCount === 0) {
      return res.status(400).json({
        message: "No active promotional products found. Add discount prices before sending.",
      });
    }

    const discountPercents = promotionalProducts
      .map((product) => {
        const price = Number(product.price || 0);
        const discountPrice = Number(product.discountPrice || 0);
        if (price <= 0 || discountPrice <= 0 || discountPrice >= price) return null;
        return Math.max(1, Math.round(((price - discountPrice) / price) * 100));
      })
      .filter((discountPercent) => Number.isFinite(discountPercent));
    const discountRange = {
      min: Math.min(...discountPercents),
      max: Math.max(...discountPercents),
    };

    const result = await notifyPromotionalEmailSubscribers({
      discountRange,
      promotionCount,
    });

    if (result.recipientCount > 0 && result.sentCount === 0 && result.failedCount > 0) {
      return res.status(502).json({
        message: "Promotion email could not be sent to any customers. Check email configuration and try again.",
        discountRange,
        promotionCount,
        ...result,
      });
    }

    return res.json({
      message:
        result.recipientCount === 0
          ? "No customers have promotional emails enabled."
          : `Promotion email sent to ${result.sentCount} customer${result.sentCount === 1 ? "" : "s"}.`,
      promotionCount,
      discountRange,
      ...result,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const filters = isAdmin ? {} : { stock: { $gt: 0 } };
    let products = await Product.find(filters)
      .sort({ createdAt: -1, _id: -1 })
      .lean();
    products = products.map((p) => ({ ...p, expiryDate: p.expiryDate || null }));
    const productsWithMetrics = await attachSalesMetrics(products, {
      salesStartDate: isAdmin ? req.query.salesStartDate : null,
      salesEndDate: isAdmin ? req.query.salesEndDate : null,
    });
    res.json(
      isAdmin
        ? productsWithMetrics
        : productsWithMetrics
            .filter((product) => product.availableStock > 0)
            .map((product) => ({
              ...product,
              stock: product.availableStock,
            }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const translateMissingProductsToKhmer = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const filters = isAdmin ? {} : { stock: { $gt: 0 } };
    const batchLimit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 4, 1),
      10
    );
    const products = await Product.find(filters).sort({ createdAt: -1, _id: -1 });
    const translatedProducts = [];
    let translatedCount = 0;

    for (const product of products) {
      if (productNeedsKhmerTranslation(product) && translatedCount < batchLimit) {
        const translatedProductData = await applyAutoKhmerTranslation(
          {
            title: product.title,
            titleKm: product.titleKm,
            description: product.description,
            descriptionKm: product.descriptionKm,
          },
          {}
        );

        product.titleKm = translatedProductData.titleKm;
        product.descriptionKm = translatedProductData.descriptionKm;
        await product.save();
        translatedCount += 1;
      }

      translatedProducts.push(product);
    }

    if (translatedCount > 0) {
      emitDomainChanged(
        "products",
        "translated",
        { translatedCount },
        { users: true }
      );
    }

    res.json(await attachSalesMetrics(translatedProducts));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const importProductsFromCsv = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const content = req.file.buffer.toString("utf-8");
    const { headers, rows } = parseCsv(content);

    if (rows.length === 0) {
      return res.status(400).json({
        message: "CSV must include a header row and at least one product row",
      });
    }

    const missingColumns = REQUIRED_CSV_COLUMNS.filter(
      (column) => !headers.includes(column)
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required CSV columns: ${missingColumns.join(", ")}`,
      });
    }

    const productsToInsert = [];
    const errors = [];

    rows.forEach((row) => {
      const result = validateAndBuildProductRow(row);
      if (typeof result === "string") {
        errors.push(result);
      } else {
        productsToInsert.push(result);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: "CSV validation failed",
        errors,
      });
    }

    const translatedProducts = await Promise.all(
      productsToInsert.map((productData) => applyAutoKhmerTranslation(productData))
    );
    const createdProducts = await Product.insertMany(translatedProducts);
    emitDomainChanged(
      "products",
      "imported",
      { count: createdProducts.length },
      { users: true }
    );

    return res.status(201).json({
      message: `Imported ${createdProducts.length} products successfully`,
      count: createdProducts.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const upsertProductsFromCsv = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const content = req.file.buffer.toString("utf-8");
    const { headers, rows } = parseCsv(content);

    if (rows.length === 0) {
      return res.status(400).json({
        message: "CSV must include a header row and at least one product row",
      });
    }

    const missingColumns = REQUIRED_CSV_COLUMNS.filter(
      (column) => !headers.includes(column)
    );

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required CSV columns: ${missingColumns.join(", ")}`,
      });
    }

    const productsToUpsert = [];
    const errors = [];

    rows.forEach((row) => {
      const result = validateAndBuildProductRow(row);
      if (typeof result === "string") {
        errors.push(result);
      } else {
        productsToUpsert.push(result);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: "CSV validation failed",
        errors,
      });
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const productData of productsToUpsert) {
      const existingProduct = await Product.findOne({
        title: productData.title,
        category: { $in: getProductCategoryLookupValues(productData.category) },
      }).sort({ createdAt: -1, _id: -1 });

      const translatedProductData = await applyAutoKhmerTranslation(
        productData,
        existingProduct || {}
      );

      if (existingProduct) {
        existingProduct.price = translatedProductData.price;
        existingProduct.discountPrice = translatedProductData.discountPrice;
        existingProduct.category = translatedProductData.category;
        existingProduct.titleKm = translatedProductData.titleKm;
        existingProduct.description = translatedProductData.description;
        existingProduct.descriptionKm = translatedProductData.descriptionKm;
        existingProduct.stock = translatedProductData.stock;
        existingProduct.isNewArrival = translatedProductData.isNewArrival;
        existingProduct.hasProductIssue = translatedProductData.hasProductIssue;
        existingProduct.issueQuantity = translatedProductData.issueQuantity;
        existingProduct.image = translatedProductData.image;
        existingProduct.expiryDate = translatedProductData.expiryDate || null;
        existingProduct.markModified("expiryDate");
        syncLowStockAlertFlag(existingProduct);
        await existingProduct.save();
        updatedCount += 1;
      } else {
        const product = new Product(translatedProductData);
        syncLowStockAlertFlag(product);
        await product.save();
        createdCount += 1;
      }
    }

    emitDomainChanged(
      "products",
      "upserted",
      { createdCount, updatedCount },
      { users: true }
    );

    return res.status(200).json({
      message: `Applied ${productsToUpsert.length} products successfully`,
      count: productsToUpsert.length,
      createdCount,
      updatedCount,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && getAvailableStock(product) <= 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Filter out reviews from deleted users and update user names
    const validReviews = [];
    let alreadyReviewed = false;
    let hasChanges = false;

    if (product.reviews && product.reviews.length > 0) {
      const User = (await import("../models/userModel.js")).default;

      for (const review of product.reviews) {
        try {
          // Check if user still exists and get current user data
          const currentUser = await User.findById(review.user);

          if (currentUser) {
            // Create review object with current user name
            const updatedReview = {
              ...review.toObject(),
              name: currentUser.name // Use current name from database
            };

            // Check if name has changed
            if (review.name !== currentUser.name) {
              hasChanges = true;
            }

            validReviews.push(updatedReview);

            // Check if current user has already reviewed this product
            if (req.user && review.user.toString() === req.user._id.toString()) {
              alreadyReviewed = true;
            }
          } else {
            // User doesn't exist, this review should be removed
            hasChanges = true;
            console.log(`Removing review from deleted user: ${review.user}`);
          }
        } catch (error) {
          // If user doesn't exist, skip this review
          hasChanges = true;
          console.log(`Error checking user for review: ${review.user}`, error);
        }
      }
    }

    // Check if reviews were removed
    if (validReviews.length !== product.reviews.length) {
      hasChanges = true;
    }

    // Always update product if there are changes
    if (hasChanges) {
      product.reviews = validReviews;
      product.numReviews = validReviews.length;

      if (validReviews.length > 0) {
        product.rating =
          validReviews.reduce((acc, item) => item.rating + acc, 0) /
          validReviews.length;
      } else {
        product.rating = 0;
      }

      await product.save();
      console.log(`Product updated: ${validReviews.length} reviews remaining`);
    }

    const productData = product.toObject();
    productData.alreadyReviewed = alreadyReviewed;

    const productWithMetrics = await attachSalesMetrics(productData);
    res.json(
      isAdmin
        ? productWithMetrics
        : {
            ...productWithMetrics,
            stock: productWithMetrics.availableStock,
          }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const translateProductToKhmer = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const translatedProductData = await applyAutoKhmerTranslation(
      {
        title: product.title,
        titleKm: product.titleKm,
        description: product.description,
        descriptionKm: product.descriptionKm,
      },
      {}
    );

    product.titleKm = translatedProductData.titleKm;
    product.descriptionKm = translatedProductData.descriptionKm;
    await product.save();
    emitDomainChanged(
      "products",
      "translated",
      { productId: product._id },
      { users: true }
    );

    const productData = product.toObject();
    res.json(await attachSalesMetrics(productData));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const normalizedCategory = normalizeProductCategory(req.body.category);
    const parsedExpiryDate = parseProductExpiryDate(
      req.body.expiryDate,
      normalizedCategory
    );

    if (!isAllowedProductCategory(normalizedCategory)) {
      return res.status(400).json({ message: "Selected category is no longer available" });
    }

    if (parsedExpiryDate.error) {
      return res.status(400).json({ message: parsedExpiryDate.error });
    }

    const hasProductIssue = parseBoolean(req.body.hasProductIssue);
    const requestedIssueQuantity = hasProductIssue
      ? Number.parseInt(req.body.issueQuantity, 10)
      : 0;
    const sizeStockData = buildSizeStockData(req.body.sizeStocks);
    const submittedStock = sizeStockData.sizeStocks.length > 0
      ? sizeStockData.stock
      : Number.parseInt(req.body.stock, 10);

    if (
      !Number.isInteger(requestedIssueQuantity) ||
      requestedIssueQuantity < (hasProductIssue ? 1 : 0)
    ) {
      return res.status(400).json({
        message: "Enter at least 1 for the product issue quantity",
      });
    }

    if (!Number.isInteger(submittedStock) || submittedStock < 0) {
      return res.status(400).json({
        message: "Stock must be a non-negative whole number",
      });
    }

    if (requestedIssueQuantity > submittedStock) {
      return res.status(400).json({
        message: "Product issue quantity cannot be greater than total stock",
      });
    }

    const translatedProductData = await applyAutoKhmerTranslation(
      {
        title: req.body.title,
        price: req.body.price,
        discountPrice: parseOptionalNumber(req.body.discountPrice),
        category: normalizedCategory,
        description: req.body.description,
        stock: submittedStock,
        sizes: sizeStockData.sizes,
        sizeStocks: sizeStockData.sizeStocks,
        isNewArrival: parseBoolean(req.body.isNewArrival),
        hasProductIssue,
        issueQuantity: requestedIssueQuantity,
        expiryDate: parsedExpiryDate.value,
      },
      product
    );

    product.title = translatedProductData.title;
    product.titleKm = translatedProductData.titleKm;
    product.price = translatedProductData.price;
    product.discountPrice = translatedProductData.discountPrice;
    product.category = normalizeProductCategory(translatedProductData.category);
    product.description = translatedProductData.description;
    product.descriptionKm = translatedProductData.descriptionKm;
    product.stock = translatedProductData.stock;
    product.sizes = translatedProductData.sizes || [];
    product.sizeStocks = translatedProductData.sizeStocks || [];
    product.isNewArrival = translatedProductData.isNewArrival;
    product.hasProductIssue = translatedProductData.hasProductIssue;
    product.issueQuantity = translatedProductData.issueQuantity;
    product.expiryDate = translatedProductData.expiryDate;
    syncTotalStockFromSizes(product);

    // 🔥 update image ONLY if new one uploaded
    if (req.file) {
      product.image = req.file.path;
    } else if (String(req.body.imageUrl || "").trim()) {
      product.image = String(req.body.imageUrl).trim();
    }

    syncLowStockAlertFlag(product);
    await product.save();
    emitDomainChanged("products", "updated", { productId: product._id }, { users: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create or update product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      // Fetch current user data from database to get latest information
      const User = (await import("../models/userModel.js")).default;
      const currentUser = await User.findById(req.user._id);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (alreadyReviewed) {
        alreadyReviewed.name = currentUser.name;
        alreadyReviewed.rating = Number(rating);
        alreadyReviewed.comment = comment;
      } else {
        const review = {
          name: currentUser.name, // Use current name from database
          rating: Number(rating),
          comment,
          user: req.user._id,
        };

        product.reviews.push(review);
      }

      product.numReviews = product.reviews.length;

      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      emitDomainChanged(
        "reviews",
        alreadyReviewed ? "updated" : "created",
        { productId: product._id, userId: req.user._id },
        { roles: ["admin", "seller"] }
      );
      emitDomainChanged(
        "products",
        "reviewed",
        { productId: product._id },
        { users: true }
      );
      res.status(alreadyReviewed ? 200 : 201).json({
        message: alreadyReviewed ? "Review updated" : "Review added",
        alreadyReviewed: Boolean(alreadyReviewed),
        updated: Boolean(alreadyReviewed),
      });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
