export class CartItemModel {
  constructor(data = {}) {
    const product = data.product || {};

    this.product = product;
    this.productId = data.productId || product._id || data._id || "";
    this.name = data.name || product.name || product.title || "";
    this.image =
      data.image || product.image || product.images?.[0] || "";
    this.price = Number(data.price ?? product.price ?? 0);
    this.quantity = Number(data.quantity ?? 1);
    this.stock = Number(data.stock ?? product.stock ?? 0);
  }

  get subtotal() {
    return this.price * this.quantity;
  }

  isAvailable() {
    return this.stock === 0 || this.quantity <= this.stock;
  }

  static fromApi(data) {
    return new CartItemModel(data);
  }
}

export class CartModel {
  constructor(items = []) {
    this.items = items.map((item) =>
      item instanceof CartItemModel ? item : new CartItemModel(item)
    );
  }

  get totalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get subtotal() {
    return this.items.reduce((total, item) => total + item.subtotal, 0);
  }

  static fromApi(data) {
    return new CartModel(data?.items || []);
  }
}

export default CartModel;
