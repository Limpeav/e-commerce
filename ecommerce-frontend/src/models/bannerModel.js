import bannerImage from "../assets/banner-promotion.jpg";

export class BannerModel {
  constructor(data = {}) {
    Object.assign(this, {
      image: data.image || bannerImage,
      alt: data.alt || data.title || "Featured shopping banner",
      title: data.title || "",
      isActive: data.isActive ?? true,
      order: Number(data.order) || 0,
    });
  }

  static fromAPI(data) {
    return new BannerModel(data);
  }

  static fallback() {
    return [new BannerModel()];
  }

  static normalizeList(banners = []) {
    if (!Array.isArray(banners) || banners.length === 0) {
      return this.fallback();
    }

    return banners
      .map((banner) => BannerModel.fromAPI(banner))
      .filter((banner) => banner.image);
  }
}
