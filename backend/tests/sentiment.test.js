import test from "node:test";
import assert from "node:assert/strict";
import {
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
