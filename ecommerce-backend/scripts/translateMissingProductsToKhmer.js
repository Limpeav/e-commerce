import dotenv from "dotenv";
import axios from "axios";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import {
  containsThaiScript,
  isGeminiConfigured,
  translateTextWithGemini,
} from "../utils/geminiTranslation.js";

dotenv.config();

const parseLimit = () => {
  const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
  const parsedLimit = Number.parseInt(limitArgument?.split("=")[1] || "", 10);

  return Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 0;
};

const parseSkip = () => {
  const skipArgument = process.argv.find((argument) => argument.startsWith("--skip="));
  const parsedSkip = Number.parseInt(skipArgument?.split("=")[1] || "", 10);

  return Number.isFinite(parsedSkip) && parsedSkip > 0 ? parsedSkip : 0;
};

const parseDelay = () => {
  const delayArgument = process.argv.find((argument) => argument.startsWith("--delay="));
  const parsedDelay = Number.parseInt(delayArgument?.split("=")[1] || "", 10);

  return Number.isFinite(parsedDelay) && parsedDelay > 0 ? parsedDelay : 0;
};

const shouldForceTranslate = () => process.argv.includes("--force");
const shouldTranslateThaiOnly = () => process.argv.includes("--thai-only");
const shouldDryRun = () => process.argv.includes("--dry-run");
const shouldUseGoogleOnly = () => process.argv.includes("--google-only");

const needsText = (value) => Boolean(String(value || "").trim());
const missingText = (value) => !String(value || "").trim();

const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const parseJsonResponse = (text = "") => {
  const cleanedText = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleanedText);
};

const translateTextWithGoogle = async (text = "") => {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    return "";
  }

  const response = await axios.get(
    "https://translate.googleapis.com/translate_a/single",
    {
      params: {
        client: "gtx",
        sl: "auto",
        tl: "km",
        dt: "t",
        q: trimmedText,
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 30000,
    }
  );

  return response.data?.[0]
    ?.map((segment) => segment?.[0] || "")
    .join("")
    .trim() || "";
};

const translateProductTextWithGoogle = async (product) => ({
  titleKm: await translateTextWithGoogle(product.title),
  descriptionKm: await translateTextWithGoogle(product.description),
});

const translateProductTextToKhmer = async (product, { googleOnly = false } = {}) => {
  if (googleOnly) {
    return translateProductTextWithGoogle(product);
  }

  const responseText = await translateTextWithGemini({
    text: JSON.stringify({
      title: product.title || "",
      description: product.description || "",
    }),
    targetLanguageName: "Khmer (Cambodian), using Khmer script only",
    systemInstruction:
      "You are a precise ecommerce translation engine. Translate the JSON values into Khmer, the Cambodian language. Use Khmer Unicode script only, Unicode range U+1780-U+17FF. Never use Thai script, Unicode range U+0E00-U+0E7F, and never use Lao script. Preserve product names, prices, measurements, brand names, URLs, emojis, and formatting. Return only valid JSON with keys titleKm and descriptionKm. Do not add explanations.",
  });

  const translatedProduct = parseJsonResponse(responseText);
  const translatedText = `${translatedProduct.titleKm || ""}\n${translatedProduct.descriptionKm || ""}`;

  if (containsThaiScript(translatedText)) {
    const error = new Error("Gemini returned Thai script instead of Khmer script");
    error.retryableTranslation = true;
    throw error;
  }

  return translatedProduct;
};

const translateProductTextWithRetry = async (product, options = {}, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await translateProductTextToKhmer(product, options);
    } catch (error) {
      const status = error.response?.status;
      const isRetryableStatus =
        status === 429 || status === 500 || status === 503 || error.retryableTranslation;
      const retryDelay = attempt * 30000;

      if (!isRetryableStatus || attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `Gemini temporarily unavailable for ${product._id}. Retrying in ${
          retryDelay / 1000
        }s (${attempt}/${maxRetries - 1})...`
      );
      await sleep(retryDelay);
    }
  }

  return {};
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  if (!isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const forceTranslate = shouldForceTranslate();
  const thaiOnly = shouldTranslateThaiOnly();
  const dryRun = shouldDryRun();
  const googleOnly = shouldUseGoogleOnly();
  const query = thaiOnly
    ? {
        $or: [
          { titleKm: { $exists: true, $ne: "" } },
          { descriptionKm: { $exists: true, $ne: "" } },
        ],
      }
    : forceTranslate
    ? {
        $or: [
          { title: { $exists: true, $ne: "" } },
          { description: { $exists: true, $ne: "" } },
        ],
      }
    : {
        $or: [
          { title: { $exists: true, $ne: "" }, $or: [{ titleKm: { $exists: false } }, { titleKm: "" }] },
          {
            description: { $exists: true, $ne: "" },
            $or: [{ descriptionKm: { $exists: false } }, { descriptionKm: "" }],
          },
        ],
      };
  const limit = parseLimit();
  const skip = parseSkip();
  const delay = parseDelay();
  const productsQuery = Product.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip);
  const queriedProducts = limit > 0 ? await productsQuery.limit(limit) : await productsQuery;
  const products = thaiOnly
    ? queriedProducts.filter(
        (product) => containsThaiScript(product.titleKm) || containsThaiScript(product.descriptionKm)
      )
    : queriedProducts;

  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  console.log(
    `Found ${products.length} product(s) ${
      thaiOnly
        ? "with Thai-script Khmer fields"
        : forceTranslate
        ? "to translate with Gemini"
        : "with missing Khmer text"
    }.`
  );

  if (dryRun) {
    products.forEach((product) => {
      console.log(`Found ${product._id}: ${product.title}`);
    });
    return;
  }

  for (const product of products) {
    try {
      let changed = false;
      const translatedProduct = await translateProductTextWithRetry(product, { googleOnly });

      if (
        needsText(product.title) &&
        (forceTranslate || thaiOnly || missingText(product.titleKm))
      ) {
        product.titleKm = translatedProduct.titleKm || "";
        changed = Boolean(product.titleKm);
      }

      if (
        needsText(product.description) &&
        (forceTranslate || thaiOnly || missingText(product.descriptionKm))
      ) {
        product.descriptionKm = translatedProduct.descriptionKm || "";
        changed = Boolean(product.descriptionKm) || changed;
      }

      if (changed) {
        await product.save();
        updatedCount += 1;
        console.log(`Updated ${product._id}: ${product.title}`);
      } else {
        skippedCount += 1;
        console.log(`Skipped ${product._id}: no translated text returned`);
      }
    } catch (error) {
      failedCount += 1;
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message;
      console.error(`Failed ${product._id}: ${message}`);
    }

    if (delay > 0) {
      await sleep(delay);
    }
  }

  console.log(
    `Done. Updated: ${updatedCount}. Skipped: ${skippedCount}. Failed: ${failedCount}.`
  );
};

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
