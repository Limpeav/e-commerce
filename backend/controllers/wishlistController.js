import Wishlist from "../models/wishlistModel.js";

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "products"
    );

    res.json(wishlist || { products: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    // Check if product already exists in wishlist (compare as strings)
    const productExists = wishlist.products.some(
      (product) => product.toString() === productId
    );

    if (!productExists) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate("products");

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (product) => product.toString() !== productId
    );

    await wishlist.save();
    await wishlist.populate("products");

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
