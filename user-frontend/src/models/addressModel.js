export class AddressModel {
  constructor(data = {}) {
    Object.assign(this, {
      _id: data._id || null,
      label: data.label || "",
      fullName: data.fullName || "",
      phone: data.phone || "",
      addressLine1: data.addressLine1 || "",
      addressLine2: data.addressLine2 || "",
      city: data.city || "",
      postalCode: data.postalCode || "",
      country: data.country || "Cambodia",
      isDefault: Boolean(data.isDefault),
    });
  }

  static fromAPI(data) {
    return new AddressModel(data);
  }

  static normalizeList(addresses = []) {
    return Array.isArray(addresses)
      ? addresses.map((address) => AddressModel.fromAPI(address))
      : [];
  }

  static sanitize(data = {}) {
    return {
      label: data.label?.trim() || "Address",
      fullName: data.fullName?.trim() || "",
      phone: data.phone?.trim() || "",
      addressLine1: data.addressLine1?.trim() || "",
      addressLine2: data.addressLine2?.trim() || "",
      city: data.city?.trim() || "",
      postalCode: data.postalCode?.trim() || "",
      country: data.country?.trim() || "Cambodia",
      isDefault: Boolean(data.isDefault),
    };
  }

  static validate(data = {}) {
    const errors = [];

    if (!data.fullName) errors.push("Full name is required");
    if (!data.phone) errors.push("Phone is required");
    if (!data.addressLine1) errors.push("Address line 1 is required");
    if (!data.city) errors.push("City is required");
    if (!data.country) errors.push("Country is required");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
