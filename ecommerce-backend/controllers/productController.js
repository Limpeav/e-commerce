import Product from "../models/Product.js";
import { syncLowStockAlertFlag } from "../utils/stockAlerts.js";

const REQUIRED_CSV_COLUMNS = ["title", "price", "category", "image"];
const CSV_HEADER_ALIASES = {
  discountprice: "discountPrice",
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

const normalizeCsvHeader = (header = "") =>
  {
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
  const category = data.category?.trim();
  const description = data.description?.trim() || "";
  const image = data.image?.trim();
  const price = Number.parseFloat(data.price);
  const discountPrice = data.discountPrice?.trim()
    ? Number.parseFloat(data.discountPrice)
    : null;
  const stock = data.stock?.trim() ? Number.parseInt(data.stock, 10) : 0;

  if (!title) {
    return `Row ${rowNumber}: title is required`;
  }

  if (!Number.isFinite(price) || price < 0) {
    return `Row ${rowNumber}: price must be a valid non-negative number`;
  }

  if (!category) {
    return `Row ${rowNumber}: category is required`;
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

  return {
    title,
    price,
    discountPrice,
    category,
    description,
    stock,
    image,
  };
};

export const createProduct = async (req, res) => {
  try {
    const { title, price, discountPrice, category, description, stock } = req.body;

    const product = new Product({
      title,
      price,
      discountPrice: parseOptionalNumber(discountPrice),
      category,
      description,
      stock,
      image: req.file?.path || "",
    });

    syncLowStockAlertFlag(product);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const filters = isAdmin ? {} : { stock: { $gt: 0 } };
    const products = await Product.find(filters).sort({ createdAt: -1, _id: -1 });
    res.json(products);
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

    const createdProducts = await Product.insertMany(productsToInsert);

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
        category: productData.category,
      }).sort({ createdAt: -1, _id: -1 });

      if (existingProduct) {
        existingProduct.price = productData.price;
        existingProduct.discountPrice = productData.discountPrice;
        existingProduct.description = productData.description;
        existingProduct.stock = productData.stock;
        existingProduct.image = productData.image;
        syncLowStockAlertFlag(existingProduct);
        await existingProduct.save();
        updatedCount += 1;
      } else {
        const product = new Product(productData);
        syncLowStockAlertFlag(product);
        await product.save();
        createdCount += 1;
      }
    }

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
    if (!isAdmin && Number(product.stock || 0) <= 0) {
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

    res.json(productData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    product.title = req.body.title;
    product.price = req.body.price;
    product.discountPrice = parseOptionalNumber(req.body.discountPrice);
    product.category = req.body.category;
    product.description = req.body.description;
    product.stock = req.body.stock;

    // 🔥 update image ONLY if new one uploaded
    if (req.file) {
      product.image = req.file.path;
    }

    syncLowStockAlertFlag(product);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create new review
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

      if (alreadyReviewed) {
        return res.status(400).json({ message: "Product already reviewed" });
      }

      // Fetch current user data from database to get latest information
      const User = (await import("../models/userModel.js")).default;
      const currentUser = await User.findById(req.user._id);

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const review = {
        name: currentUser.name, // Use current name from database
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);

      product.numReviews = product.reviews.length;

      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Review added" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
