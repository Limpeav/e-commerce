export class OrderModel {
  constructor(data = {}) {
    this._id = data._id || "";
    this.orderStatus = data.orderStatus || "Pending";
    this.paymentStatus = data.paymentStatus || "Pending";
    this.totalPrice = Number(data.totalPrice ?? 0);
    this.shippingPrice = Number(data.shippingPrice ?? 0);
    this.taxPrice = Number(data.taxPrice ?? 0);
    this.itemsPrice = Number(data.itemsPrice ?? 0);
    this.orderItems = Array.isArray(data.orderItems) ? data.orderItems : [];
    this.shippingAddress = data.shippingAddress || {};
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromApi(data) {
    return new OrderModel(data);
  }
}

export default OrderModel;
