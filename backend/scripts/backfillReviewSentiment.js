import "../config/env.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { classifyReviewSentiment } from "../utils/sentiment.js";

const run = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(mongoUri);

  const products = await Product.find({ "reviews.0": { $exists: true } });
  let updatedProducts = 0;
  let updatedReviews = 0;

  for (const product of products) {
    let productChanged = false;

    product.reviews.forEach((review) => {
      const sentiment = classifyReviewSentiment({
        rating: review.rating,
        comment: review.comment,
      });

      if (
        review.sentimentLabel !== sentiment.label ||
        Number(review.sentimentScore || 0) !== sentiment.score
      ) {
        review.sentimentLabel = sentiment.label;
        review.sentimentScore = sentiment.score;
        review.sentimentAnalyzedAt = new Date();
        productChanged = true;
        updatedReviews += 1;
      }
    });

    if (productChanged) {
      await product.save();
      updatedProducts += 1;
    }
  }

  console.log(
    `Backfilled sentiment for ${updatedReviews} review${updatedReviews === 1 ? "" : "s"} across ${updatedProducts} product${updatedProducts === 1 ? "" : "s"}.`
  );
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
