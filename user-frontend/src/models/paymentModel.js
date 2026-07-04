export class PaymentModel {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  static fromAPI(data) {
    return new PaymentModel(data);
  }

  static getStatus(payment) {
    return (payment?.status || "Pending").toLowerCase();
  }

  static isPending(payment) {
    return this.getStatus(payment) === "pending";
  }

  static getTimeLeft(expiresAt) {
    if (!expiresAt) {
      return null;
    }

    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) {
      return "00:00";
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
}
