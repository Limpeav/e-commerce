import asyncHandler from "express-async-handler";
import Setting from "../models/Setting.js";

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
    settings.forEach((s) => {
        obj[s.key] = s.value;
    });
    return obj;
};

const toFullObject = (settings) => {
    return settings.map((s) => ({
        key: s.key,
        value: s.value,
        label: s.label,
        description: s.description,
    }));
};

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
                { key, value, label: DEFAULTS[key].label, description: DEFAULTS[key].description },
                { upsert: true, new: true }
            );
        }
    }
    const settings = await Setting.find({});
    res.json(toPlainObject(settings));
});

// @desc    Get exchange rate (for public/internal use)
// @route   GET /api/settings/exchange-rate
// @access  Public
export const getExchangeRate = asyncHandler(async (req, res) => {
    const setting = await Setting.findOne({ key: "usd_to_khr_rate" });
    const rate = setting
        ? parseFloat(setting.value)
        : parseFloat(process.env.USD_TO_KHR_RATE) || 4100;
    res.json({ exchangeRate: rate, usd_to_khr_rate: rate });
});
