import Cart from "../models/cartModel.js";
import Product from "../models/Product.js";
import {
  normalizeSelectedSize,
  validateProductSize,
} from "../utils/productOptions.js";

const sameCartLine = (item, productId, size = "") =>
  item.product.toString() === productId && String(item.size || "") === String(size || "");

const populateAndPruneCart = async (cart) => {
  if (!cart) {
    return null;
  }

  await cart.populate("items.product");

  const validItems = cart.items.filter((item) => item.product?._id);

  if (validItems.length !== cart.items.length) {
    cart.items = validItems.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      size: item.size,
    }));
    await cart.save();
    await cart.populate("items.product");
  }

  return cart;
};

export const getCart = async (req, res) => {
  const cart = await populateAndPruneCart(
    await Cart.findOne({ user: req.user._id })
  );

  res.json(cart || { items: [] });
};

// add item to cart
export const addToCart = async (req, res) => {
  const { productId, quantity = 1, size } = req.body;
  const product = await Product.findById(productId);

  if (!product) return res.status(404).json({ message: "Product not found" });

  const normalizedSize = normalizeSelectedSize(size);
  const sizeError = validateProductSize(product, normalizedSize);

  if (sizeError) return res.status(400).json({ message: sizeError });

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  const itemIndex = cart.items.findIndex((item) =>
    sameCartLine(item, productId, normalizedSize)
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += Number(quantity || 1);
  } else {
    cart.items.push({ product: productId, quantity, size: normalizedSize });
  }

  await cart.save();

  await populateAndPruneCart(cart);

  res.json(cart);
};

// remove item
export const removeFromCart = async (req, res) => {
  const { productId } = req.params;
  const normalizedSize = normalizeSelectedSize(req.query.size);

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter((item) => !sameCartLine(item, productId, normalizedSize));

  await cart.save();

  await populateAndPruneCart(cart);

  res.json(cart);
};

// update
export const updateCartQuantity = async (req, res) => {
  const { productId } = req.params;
  const { quantity, size } = req.body;
  const normalizedSize = normalizeSelectedSize(size);

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find((i) => sameCartLine(i, productId, normalizedSize));

  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = quantity;
  await cart.save();

  // Populate product details before sending response
  await populateAndPruneCart(cart);

  res.json(cart);
};

// clear cart
export const clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = [];
  await cart.save();

  await populateAndPruneCart(cart);

  res.json(cart);
};
