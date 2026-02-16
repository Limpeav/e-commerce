import Cart from "../models/cartModel.js";
import Product from "../models/Product.js";

const validateQuantity = (quantity) => {
  const numericQuantity = Number(quantity);
  if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
    return null;
  }
  return numericQuantity;
};

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  res.json(cart || { items: [] });
};

// add item to cart
export const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const safeQuantity = validateQuantity(quantity);

  if (!productId || !safeQuantity) {
    return res.status(400).json({ message: "Invalid product or quantity" });
  }

  const product = await Product.findById(productId).select("_id title stock");
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    const nextQuantity = cart.items[itemIndex].quantity + safeQuantity;
    if (Number(product.stock || 0) < nextQuantity) {
      return res.status(400).json({
        message: `Only ${product.stock || 0} item(s) available in stock`,
      });
    }
    cart.items[itemIndex].quantity = nextQuantity;
  } else {
    if (Number(product.stock || 0) < safeQuantity) {
      return res.status(400).json({
        message: `Only ${product.stock || 0} item(s) available in stock`,
      });
    }
    cart.items.push({ product: productId, quantity: safeQuantity });
  }

  await cart.save();

  await cart.populate("items.product");

  res.json(cart);
};

// remove item
export const removeFromCart = async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  await cart.save();

  await cart.populate("items.product");

  res.json(cart);
};

// update
export const updateCartQuantity = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const safeQuantity = validateQuantity(quantity);

  if (!safeQuantity) {
    return res.status(400).json({ message: "Quantity must be a positive integer" });
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find((i) => i.product.toString() === productId);

  if (!item) return res.status(404).json({ message: "Item not found" });

  const product = await Product.findById(productId).select("_id title stock");
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (Number(product.stock || 0) < safeQuantity) {
    return res.status(400).json({
      message: `Only ${product.stock || 0} item(s) available in stock`,
    });
  }

  item.quantity = safeQuantity;
  await cart.save();

  // Populate product details before sending response
  await cart.populate("items.product");

  res.json(cart);
};

// clear cart
export const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = [];
  await cart.save();

  await cart.populate("items.product");

  res.json(cart);
};
