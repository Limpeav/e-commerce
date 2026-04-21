import { BannerModel } from "../models/bannerModel.js";
import { fetchBanners } from "../services/bannerService.js";

export class BannerController {
  static async getHomepageBanners() {
    try {
      const banners = await fetchBanners();
      return { success: true, data: BannerModel.normalizeList(banners) };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: BannerModel.fallback(),
      };
    }
  }
}
