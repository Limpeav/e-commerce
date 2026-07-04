import Banner from "../models/Banner.js";
import { emitDomainChanged } from "../realtime/socket.js";

export const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({
      sortOrder: 1,
      createdAt: -1,
      _id: -1,
    });

    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({
      sortOrder: 1,
      createdAt: -1,
      _id: -1,
    });

    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ message: "Banner image is required" });
    }

    const { title = "", alt = "", sortOrder = 0, isActive = true } = req.body;

    const banner = new Banner({
      title,
      alt,
      image: req.file.path,
      sortOrder: Number(sortOrder) || 0,
      isActive: String(isActive) !== "false",
    });

    const savedBanner = await banner.save();
    emitDomainChanged("banners", "created", { bannerId: savedBanner._id }, { users: true });
    res.status(201).json(savedBanner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      banner.title = req.body.title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "alt")) {
      banner.alt = req.body.alt;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "sortOrder")) {
      banner.sortOrder = Number(req.body.sortOrder) || 0;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
      banner.isActive = String(req.body.isActive) !== "false";
    }

    if (req.file?.path) {
      banner.image = req.file.path;
    }

    const updatedBanner = await banner.save();
    emitDomainChanged("banners", "updated", { bannerId: updatedBanner._id }, { users: true });
    res.json(updatedBanner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    await Banner.findByIdAndDelete(req.params.id);
    emitDomainChanged("banners", "deleted", { bannerId: req.params.id }, { users: true });
    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
