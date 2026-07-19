import asyncHandler from "express-async-handler";
import {
  getFinancialSettings,
  sanitizeFinancialSettings,
  upsertFinancialSettings,
} from "../utils/financialSettings.js";

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
