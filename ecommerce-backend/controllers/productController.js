import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {
    const { title, price, discountPrice, category, description, stock } = req.body;

    const product = new Product({
      title,
      price,
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      category,
      description,
      stock,
      image: req.file?.path || "",
    });

    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1, _id: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

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
    product.discountPrice = req.body.discountPrice ? parseFloat(req.body.discountPrice) : null;
    product.category = req.body.category;
    product.description = req.body.description;
    product.stock = req.body.stock;

    // 🔥 update image ONLY if new one uploaded
    if (req.file) {
      product.image = req.file.path;
    }

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
