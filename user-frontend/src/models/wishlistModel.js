import { ProductModel } from "./productModel.js";

export class WishlistModel {
  constructor(items = []) {
    this.items = items.map((item) =>
      item instanceof ProductModel ? item : new ProductModel(item)
    );
  }

  has(productId) {
    return this.items.some((item) => item._id === productId);
  }

  static fromApi(data) {
    const items = Array.isArray(data)
      ? data
      : data?.products || data?.items || [];

    return new WishlistModel(items);
  }
}

export default WishlistModel;
