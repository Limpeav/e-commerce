import test from "node:test";
import assert from "node:assert/strict";
import {
  attachReviewSentiment,
  buildDashboardReviewHealth,
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

test("classifyReviewSentiment detects negative Khmer text even with five stars", () => {
  const result = classifyReviewSentiment({
    rating: 5,
    comment: "គុណភាពអន់ណាស់ មិនល្អទេ",
  });

  assert.equal(result.label, "Negative");
  assert.ok(result.score < 0);
});

test("classifyReviewSentiment handles spaced Khmer negation", () => {
  const result = classifyReviewSentiment({
    rating: 3,
    comment: "មិន ល្អ",
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

test("buildSentimentAnalytics filters reviews by date and sentiment", () => {
  const analytics = buildSentimentAnalytics(
    [
      {
        _id: "product-1",
        title: "Baby Diaper",
        category: "Diapering & Care",
        reviews: [
          {
            rating: 5,
            sentimentLabel: "Positive",
            sentimentScore: 1.2,
            comment: "Good quality",
            createdAt: "2026-07-01T08:00:00.000Z",
          },
          {
            rating: 1,
            sentimentLabel: "Negative",
            sentimentScore: -1.5,
            comment: "Leaking and poor quality",
            createdAt: "2026-07-02T08:00:00.000Z",
          },
          {
            rating: 2,
            sentimentLabel: "Negative",
            sentimentScore: -1.1,
            comment: "Delayed and damaged",
            createdAt: "2026-07-05T08:00:00.000Z",
          },
        ],
      },
    ],
    {
      startDate: "2026-07-02T00:00:00.000Z",
      endDate: "2026-07-03T00:00:00.000Z",
      sentiment: "Negative",
    }
  );

  assert.equal(analytics.total, 1);
  assert.equal(analytics.negative, 1);
  assert.equal(analytics.positive, 0);
  assert.equal(analytics.productInsights[0].negativeRate, 100);
});

test("buildSentimentAnalytics ranks top negative products needing action", () => {
  const analytics = buildSentimentAnalytics([
    {
      _id: "product-1",
      title: "Training Cup",
      category: "Feeding",
      reviews: [
        {
          rating: 1,
          sentimentLabel: "Negative",
          sentimentScore: -1.8,
          comment: "It leaks badly.",
          createdAt: "2026-07-01T08:00:00.000Z",
        },
        {
          rating: 1,
          sentimentLabel: "Negative",
          sentimentScore: -1.6,
          comment: "Still leaking.",
          createdAt: "2026-07-03T08:00:00.000Z",
        },
      ],
    },
    {
      _id: "product-2",
      title: "Baby Lotion",
      category: "Bath & Skin",
      reviews: [
        {
          rating: 2,
          sentimentLabel: "Negative",
          sentimentScore: -1,
          comment: "Too expensive.",
          createdAt: "2026-07-02T08:00:00.000Z",
        },
        {
          rating: 5,
          sentimentLabel: "Positive",
          sentimentScore: 1.3,
          comment: "Gentle and excellent.",
          createdAt: "2026-07-04T08:00:00.000Z",
        },
      ],
    },
  ]);

  assert.equal(analytics.topNegativeProducts.length, 2);
  assert.equal(analytics.topNegativeProducts[0].productTitle, "Training Cup");
  assert.equal(analytics.topNegativeProducts[0].negative, 2);
  assert.equal(analytics.topNegativeProducts[0].negativeRate, 100);
  assert.equal(
    analytics.topNegativeProducts[0].latestNegativeReview.comment,
    "Still leaking."
  );
});

test("buildSentimentAnalytics normalizes category aliases", () => {
  const analytics = buildSentimentAnalytics([
    {
      _id: "product-1",
      title: "Nursery Shelf",
      category: "Nursery & Decor",
      reviews: [
        {
          rating: 5,
          comment: "Excellent quality",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    },
    {
      _id: "product-2",
      title: "Baby Crib",
      category: "Furniture",
      reviews: [
        {
          rating: 4,
          comment: "Good and reliable",
          createdAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    },
  ]);

  assert.equal(analytics.categoryInsights.length, 1);
  assert.equal(analytics.categoryInsights[0].category, "Furniture");
  assert.equal(analytics.categoryInsights[0].totalReviews, 2);
});

test("buildDashboardReviewHealth returns negative category rates from review data", () => {
  const reviewHealth = buildDashboardReviewHealth([
    {
      _id: "product-1",
      title: "Stacking Toy",
      category: "Toy",
      reviews: [
        {
          rating: 1,
          comment: "Broken and unsafe.",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
        {
          rating: 2,
          comment: "Poor quality and frustrating.",
          createdAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    },
    {
      _id: "product-2",
      title: "Baby Lotion",
      category: "Bath & Skin",
      reviews: [
        {
          rating: 5,
          comment: "Gentle and excellent.",
          createdAt: "2026-07-03T00:00:00.000Z",
        },
        {
          rating: 3,
          comment: "It is okay.",
          createdAt: "2026-07-04T00:00:00.000Z",
        },
      ],
    },
    {
      _id: "product-3",
      title: "Unreviewed Product",
      category: "Milk",
      reviews: [],
    },
  ]);

  assert.equal(reviewHealth.totalReviews, 4);
  assert.equal(reviewHealth.sentimentCounts.Negative, 2);
  assert.equal(reviewHealth.unratedProducts, 1);
  assert.equal(reviewHealth.categoryRatings.length, 1);
  assert.equal(reviewHealth.categoryRatings[0].name, "Toy & Play");
  assert.equal(reviewHealth.categoryRatings[0].reviewCount, 2);
  assert.equal(reviewHealth.categoryRatings[0].negative, 2);
  assert.equal(reviewHealth.categoryRatings[0].negativeRate, 100);
  assert.equal(
    reviewHealth.ratingDistribution.find((item) => item.rating === 1).count,
    1
  );
});
