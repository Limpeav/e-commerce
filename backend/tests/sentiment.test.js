import test from "node:test";
import assert from "node:assert/strict";
import {
  attachReviewSentiment,
  buildSentimentAnalytics,
  classifyReviewSentiment,
  summarizeSentiment,
} from "../utils/sentiment.js";

test("classifyReviewSentiment returns positive for strong positive review", () => {
  const result = classifyReviewSentiment({
    rating: 5,
    comment: "Very good quality, safe and comfortable. I highly recommend it.",
  });

  assert.equal(result.label, "Positive");
  assert.ok(result.score > 0);
});

test("classifyReviewSentiment returns negative for strong negative review", () => {
  const result = classifyReviewSentiment({
    rating: 1,
    comment: "Very bad and unsafe. It caused rash and I want to return it.",
  });

  assert.equal(result.label, "Negative");
  assert.ok(result.score < 0);
});

test("summarizeSentiment aggregates counts and overall label", () => {
  const summary = summarizeSentiment([
    { sentimentLabel: "Positive", sentimentScore: 1.6 },
    { sentimentLabel: "Positive", sentimentScore: 1.1 },
    { sentimentLabel: "Neutral", sentimentScore: 0.1 },
    { sentimentLabel: "Negative", sentimentScore: -0.6 },
  ]);

  assert.equal(summary.total, 4);
  assert.equal(summary.positive, 2);
  assert.equal(summary.neutral, 1);
  assert.equal(summary.negative, 1);
  assert.equal(summary.label, "Positive");
});

test("attachReviewSentiment adds label and score to legacy review data", () => {
  const review = attachReviewSentiment({
    rating: 2,
    comment: "The diaper is leaking and caused rash.",
  });

  assert.equal(review.sentimentLabel, "Negative");
  assert.equal(typeof review.sentimentScore, "number");
});

test("buildSentimentAnalytics creates product, category, and trend insights", () => {
  const analytics = buildSentimentAnalytics([
    {
      _id: "product-1",
      title: "Baby Diaper",
      category: "Diapering & Care",
      reviews: [
        {
          rating: 5,
          comment: "Very good quality and safe",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
        {
          rating: 1,
          comment: "Very bad, leaking and caused rash",
          createdAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    },
  ]);

  assert.equal(analytics.total, 2);
  assert.equal(analytics.positive, 1);
  assert.equal(analytics.negative, 1);
  assert.equal(analytics.productInsights[0].productTitle, "Baby Diaper");
  assert.equal(analytics.categoryInsights[0].category, "Diapering & Care");
  assert.equal(analytics.trend[0].month, "2026-07");
});
