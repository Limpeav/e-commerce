import asyncHandler from "express-async-handler";
import Setting from "../models/Setting.js";
import {
  getFinancialSettings,
  sanitizeFinancialSettings,
  upsertFinancialSettings,
} from "../utils/financialSettings.js";

const DEFAULTS = {
  usd_to_khr_rate: {
    value: parseFloat(process.env.USD_TO_KHR_RATE) || 4100,
    label: "USD to KHR Exchange Rate",
    description: "Exchange rate used for BAKONG KHQR payment conversion",
  },
};

const ensureDefaults = async () => {
  for (const [key, setting] of Object.entries(DEFAULTS)) {
    await Setting.findOneAndUpdate(
      { key },
      { $setOnInsert: { key, ...setting } },
      { upsert: true, new: true }
    );
  }
};

const toPlainObject = (settings) => {
  const obj = {};
  settings.forEach((setting) => {
    obj[setting.key] = setting.value;
  });
  return obj;
};

const toFullObject = (settings) =>
  settings.map((setting) => ({
    key: setting.key,
    value: setting.value,
    label: setting.label,
    description: setting.description,
  }));

export const getPublicFinancialSettings = asyncHandler(async (req, res) => {
  const settings = await getFinancialSettings();
  res.json(settings);
});

export const getAdminFinancialSettings = asyncHandler(async (req, res) => {
  const settings = await getFinancialSettings();
  res.json(settings);
});

export const updateAdminFinancialSettings = asyncHandler(async (req, res) => {
  const settings = sanitizeFinancialSettings(req.body);
  const updatedSettings = await upsertFinancialSettings(settings, req.user?._id);

  res.json(sanitizeFinancialSettings(updatedSettings));
});

// @desc    Get all settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSettings = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const settings = await Setting.find({});
  res.json(toPlainObject(settings));
});

// @desc    Get full settings list with metadata
// @route   GET /api/admin/settings/full
// @access  Private/Admin
export const getSettingsFull = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const settings = await Setting.find({});
  res.json(toFullObject(settings));
});

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
export const updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body;

  for (const [key, value] of Object.entries(updates)) {
    if (DEFAULTS[key]) {
      await Setting.findOneAndUpdate(
        { key },
        {
          key,
          value,
          label: DEFAULTS[key].label,
          description: DEFAULTS[key].description,
        },
        { upsert: true, new: true }
      );
    }
  }

  const settings = await Setting.find({});
  res.json(toPlainObject(settings));
});

// @desc    Get exchange rate
// @route   GET /api/payment/exchange-rate
// @access  Public
export const getExchangeRate = asyncHandler(async (req, res) => {
  await ensureDefaults();
  const setting = await Setting.findOne({ key: "usd_to_khr_rate" });
  const rate = setting
    ? parseFloat(setting.value)
    : parseFloat(process.env.USD_TO_KHR_RATE) || 4100;

  res.json({ exchangeRate: rate, usd_to_khr_rate: rate });
});
