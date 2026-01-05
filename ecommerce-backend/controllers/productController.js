import Product from "../models/Product.js";

export const createProduct = async (req, res) => {
  try {
    const { title, price, category, description, stock } = req.body;

    const product = new Product({
      title,
      price,
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
    const products = await Product.find();
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

    res.json(product);
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
