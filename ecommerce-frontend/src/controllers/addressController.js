import { AddressModel } from "../models/addressModel.js";
import { addressService } from "../services/addressService.js";

export class AddressController {
  static async getAddresses() {
    try {
      const response = await addressService.getAddresses();
      return {
        success: true,
        data: AddressModel.normalizeList(response.data),
      };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  static async saveAddress(addressId, formData) {
    try {
      const payload = AddressModel.sanitize(formData);
      const validation = AddressModel.validate(payload);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }

      const response = addressId
        ? await addressService.updateAddress(addressId, payload)
        : await addressService.createAddress(payload);

      return {
        success: true,
        data: AddressModel.normalizeList(response.data),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async deleteAddress(addressId) {
    try {
      const response = await addressService.deleteAddress(addressId);
      return {
        success: true,
        data: AddressModel.normalizeList(response.data),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async setDefaultAddress(addressId) {
    try {
      const response = await addressService.setDefaultAddress(addressId);
      return {
        success: true,
        data: AddressModel.normalizeList(response.data),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static createEmptyForm() {
    return AddressModel.sanitize({});
  }
}
