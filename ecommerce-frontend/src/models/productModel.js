export class ProductModel {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static fromAPI(data) {
    return new ProductModel(data);
  }

  static sanitize(data) {
    return {
      title: data.title?.trim() || "",
      price: Number(data.price) || 0,
      discountPrice: Number(data.discountPrice) || null,
      category: data.category?.trim() || "",
      image: data.image?.trim() || "",
      description: data.description?.trim() || "",
      stock: Number(data.stock) || 0,
    };
  }

  static validate(data) {
    const errors = [];
    if (!data.title) errors.push("Title is required");
    if (!data.price || data.price <= 0) errors.push("Price must be greater than 0");
    if (!data.category) errors.push("Category is required");
    if (!data.image) errors.push("Image is required");
    return { isValid: errors.length === 0, errors };
  }
}