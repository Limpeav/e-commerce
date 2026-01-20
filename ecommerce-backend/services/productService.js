import Product from "../models/Product.js";
import User from "../models/userModel.js";

/**
 * Product Service - Business Logic Layer
 * Handles all product-related business logic
 */
export const productService = {
  /**
   * Get all products
   * @returns {Promise<Array>} Array of products
   */
  async getAllProducts() {
    return await Product.find();
  },

  /**
   * Get product by ID with review validation
   * @param {string} productId - Product ID
   * @param {string} userId - Optional user ID for review check
   * @returns {Promise<Object>} Product object with validated reviews
   */
  async getProductById(productId, userId = null) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Validate and clean reviews
    const { validReviews, hasChanges } = await this.validateReviews(
      product.reviews || [],
      userId
    );

    // Update product if reviews changed
    if (hasChanges) {
      product.reviews = validReviews;
      product.numReviews = validReviews.length;
      product.rating =
        validReviews.length > 0
          ? validReviews.reduce((acc, item) => item.rating + acc, 0) /
            validReviews.length
          : 0;
      await product.save();
    }

    const productData = product.toObject();
    productData.alreadyReviewed = userId
      ? validReviews.some(
          (review) => review.user.toString() === userId.toString()
        )
      : false;

    return productData;
  },

  /**
   * Validate reviews and remove orphaned ones
   * @param {Array} reviews - Array of reviews
   * @param {string} userId - Optional user ID
   * @returns {Promise<Object>} Object with validReviews and hasChanges flag
   */
  async validateReviews(reviews, userId = null) {
    const validReviews = [];
    let hasChanges = false;

    for (const review of reviews) {
      try {
        const currentUser = await User.findById(review.user);

        if (currentUser) {
          const updatedReview = {
            ...review.toObject(),
            name: currentUser.name,
          };

          if (review.name !== currentUser.name) {
            hasChanges = true;
          }

          validReviews.push(updatedReview);
        } else {
          hasChanges = true;
          console.log(`Removing review from deleted user: ${review.user}`);
        }
      } catch (error) {
        hasChanges = true;
        console.log(`Error checking user for review: ${review.user}`, error);
      }
    }

    return { validReviews, hasChanges };
  },

  /**
   * Create a new product
   * @param {Object} productData - Product data
   * @returns {Promise<Object>} Created product
   */
  async createProduct(productData) {
    const product = new Product(productData);
    return await product.save();
  },

  /**
   * Update product by ID
   * @param {string} productId - Product ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated product
   */
  async updateProduct(productId, updateData) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    Object.assign(product, updateData);
    return await product.save();
  },

  /**
   * Delete product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<void>}
   */
  async deleteProduct(productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }
    await product.deleteOne();
  },

  /**
   * Add review to product
   * @param {string} productId - Product ID
   * @param {string} userId - User ID
   * @param {Object} reviewData - Review data (rating, comment)
   * @returns {Promise<Object>} Updated product
   */
  async addReview(productId, userId, reviewData) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      throw new Error("Product already reviewed");
    }

    // Get current user data
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    const review = {
      name: currentUser.name,
      rating: Number(reviewData.rating),
      comment: reviewData.comment,
      user: userId,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    return await product.save();
  },
};
