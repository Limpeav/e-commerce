export class ProductModel {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static fromAPI(data) {
    return new ProductModel(data);
  }

  static sanitize(data) {
    const discountPriceValue =
      data.discountPrice === null || data.discountPrice === undefined || data.discountPrice === ""
        ? null
        : Number(data.discountPrice);

    return {
      title: data.title?.trim() || "",
      titleKm: data.titleKm?.trim() || "",
      price: Number(data.price) || 0,
      discountPrice: Number.isFinite(discountPriceValue) ? discountPriceValue : null,
      category: data.category?.trim() || "",
      image: data.image?.trim() || "",
      description: data.description?.trim() || "",
      descriptionKm: data.descriptionKm?.trim() || "",
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
