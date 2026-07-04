import Setting from "../models/Setting.js";

export const USD_TO_KHR_RATE_KEY = "usd_to_khr_rate";
export const DEFAULT_USD_TO_KHR_RATE = 4100;

export const normalizeUsdToKhrRate = (value) => {
    const rate = Number(value);

    if (!Number.isFinite(rate) || rate <= 0) {
        return null;
    }

    return rate;
};

export const getDefaultUsdToKhrRate = () =>
    normalizeUsdToKhrRate(process.env.USD_TO_KHR_RATE) || DEFAULT_USD_TO_KHR_RATE;

export const getUsdToKhrRate = async () => {
    const rateSetting = await Setting.findOne({ key: USD_TO_KHR_RATE_KEY }).lean();

    return normalizeUsdToKhrRate(rateSetting?.value) || getDefaultUsdToKhrRate();
};

export const saveUsdToKhrRate = async (value) => {
    const rate = normalizeUsdToKhrRate(value);

    if (!rate) {
        const error = new Error("USD to KHR exchange rate must be a positive number");
        error.statusCode = 400;
        throw error;
    }

    await Setting.findOneAndUpdate(
        { key: USD_TO_KHR_RATE_KEY },
        { $set: { value: rate } },
        { new: true, upsert: true, runValidators: true }
    );

    return rate;
};
