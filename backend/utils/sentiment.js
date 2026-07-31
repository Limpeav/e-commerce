import { normalizeProductCategory } from "./productCategories.js";

const SENTIMENT_LEXICON = {
  // Positive
  good: 1.2,
  great: 1.5,
  excellent: 1.8,
  amazing: 1.8,
  love: 2.0,
  perfect: 1.8,
  helpful: 1.1,
  fast: 0.9,
  safe: 1.3,
  soft: 1.2,
  quality: 1.1,
  comfortable: 1.2,
  recommend: 1.5,
  satisfied: 1.4,
  reliable: 1.4,
  genuine: 1.2,
  authentic: 1.2,
  gentle: 1.3,
  smooth: 1.0,
  clean: 0.8,
  affordable: 1.1,
  worth: 1.0,
  happy: 1.3,
  ល្អ: 1.2,
  ស្រឡាញ់: 2.0,
  ពេញចិត្ត: 1.4,
  ណែនាំ: 1.5,
  សុវត្ថិភាព: 1.3,
  ទន់: 1.2,
  រហ័ស: 0.9,
  ស្អាត: 0.8,
  សមរម្យ: 1.1,

  // Negative
  bad: -1.4,
  poor: -1.3,
  terrible: -2.0,
  awful: -2.0,
  hate: -2.1,
  slow: -1.0,
  broken: -1.8,
  damaged: -1.8,
  unsafe: -1.8,
  hard: -0.8,
  disappointed: -1.6,
  worst: -2.1,
  return: -1.2,
  fake: -1.8,
  expired: -2.0,
  leak: -1.5,
  leaking: -1.5,
  rash: -1.8,
  itchy: -1.6,
  delay: -1.1,
  delayed: -1.1,
  expensive: -0.9,
  អន់: -1.5,
  អាក្រក់: -1.6,
  ស្អប់: -2.1,
  ខូច: -1.8,
  យឺត: -1.0,
  ថ្លៃ: -0.9,
  ក្លែងក្លាយ: -1.8,
  ហួសកំណត់: -2.0,
  ធ្លាយ: -1.5,
  កន្ទួល: -1.8,
  រមាស់: -1.6,
  ខកចិត្ត: -1.6,
};

const PHRASE_LEXICON = {
  "high quality": 1.8,
  "value for money": 1.7,
  "works well": 1.4,
  "very good": 1.5,
  "not bad": 1.0,
  "no issues": 1.2,
  "not recommend": -1.8,
  "waste money": -1.9,
  "very bad": -1.9,
  "too expensive": -1.3,
  "not safe": -2.0,
  "caused rash": -2.2,
  "គុណភាពល្អ": 1.8,
  "ល្អណាស់": 1.8,
  "ប្រើបានល្អ": 1.4,
  "តម្លៃសមរម្យ": 1.1,
  "ដឹកជញ្ជូនលឿន": 1.3,
  "អន់ណាស់": -2.0,
  "គុណភាពអន់": -2.1,
  "មិនល្អ": -2.0,
  "មិនមានសុវត្ថិភាព": -2.0,
  "ខូចគុណភាព": -2.0,
  "ថ្លៃពេក": -1.3,
  "ដឹកជញ្ជូនយឺត": -1.4,
  "ធ្វើឲ្យកន្ទួល": -2.2,
};

const NEGATORS = new Set([
  "not",
  "never",
  "no",
  "none",
  "hardly",
  "rarely",
  "without",
  "cannot",
  "cant",
  "dont",
  "didnt",
  "isnt",
  "wasnt",
  "wont",
  "មិន",
  "អត់",
  "គ្មាន",
]);

const INTENSIFIERS = new Set([
  "very",
  "really",
  "extremely",
  "super",
  "highly",
  "too",
  "so",
  "quite",
  "ណាស់",
  "ខ្លាំង",
  "ពិតជា",
]);

const DAMPENERS = new Set([
  "slightly",
  "little",
  "somewhat",
  "kinda",
  "kindof",
  "បន្តិច",
  "តិចតួច",
]);

const normalizeText = (value = "") => value.toString().trim().toLowerCase();

const tokenize = (text) => {
  const normalized = normalizeText(text).replace(/[^\p{L}\p{M}\p{N}\s']/gu, " ");
  return normalized.split(/\s+/).filter(Boolean);
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const calculateLexicalSignal = (comment = "") => {
  const text = normalizeText(comment);
  if (!text) {
    return 0;
  }

  let phraseScore = 0;
  for (const [phrase, score] of Object.entries(PHRASE_LEXICON)) {
    if (text.includes(phrase)) {
      phraseScore += score;
    }
  }

  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return Number(phraseScore.toFixed(2));
  }

  let tokenScore = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const base = SENTIMENT_LEXICON[token];
    if (!base) {
      continue;
    }

    let modifier = 1;
    const previousOne = tokens[index - 1];
    const previousTwo = tokens[index - 2];
    const context = [previousOne, previousTwo].filter(Boolean);

    if (context.some((item) => NEGATORS.has(item))) {
      modifier *= -1;
    }

    if (context.some((item) => INTENSIFIERS.has(item))) {
      modifier *= 1.35;
    }

    if (context.some((item) => DAMPENERS.has(item))) {
      modifier *= 0.7;
    }

    tokenScore += base * modifier;
  }

  const normalizedLexical = clamp(
    (tokenScore + phraseScore) / Math.max(1, Math.sqrt(tokens.length)),
    -3,
    3
  );
  return Number(normalizedLexical.toFixed(2));
};

export const classifyReviewSentiment = ({ rating, comment }) => {
  const numericRating = Number(rating);
  const safeRating = Number.isFinite(numericRating) ? numericRating : 3;
  const ratingSignal = clamp((safeRating - 3) / 2, -1, 1);
  const lexicalSignal = calculateLexicalSignal(comment);

  // Rating and text both matter. Rating is slightly stronger when present.
  const blendedScore = Number((ratingSignal * 1.25 + lexicalSignal * 0.85).toFixed(2));

  let label = "Neutral";
  if (blendedScore >= 0.45) {
    label = "Positive";
  } else if (blendedScore <= -0.45) {
    label = "Negative";
  }

  return { label, score: blendedScore };
};

export const getReviewSentiment = (review = {}) => {
  const existingLabel = review.sentimentLabel;
  const existingScore = Number(review.sentimentScore);

  if (
    ["Positive", "Neutral", "Negative"].includes(existingLabel) &&
    Number.isFinite(existingScore)
  ) {
    return {
      label: existingLabel,
      score: existingScore,
    };
  }

  return classifyReviewSentiment({
    rating: review.rating,
    comment: review.comment,
  });
};

export const attachReviewSentiment = (review = {}) => {
  const sentiment = getReviewSentiment(review);

  return {
    ...review,
    sentimentLabel: sentiment.label,
    sentimentScore: sentiment.score,
  };
};

export const summarizeSentiment = (reviews = []) => {
  const summary = {
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
    averageScore: 0,
    label: "Neutral",
  };

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return summary;
  }

  let scoreSum = 0;

  for (const review of reviews) {
    const sentimentLabel = review.sentimentLabel || "Neutral";
    const sentimentScore = Number(review.sentimentScore || 0);
    scoreSum += sentimentScore;
    summary.total += 1;

    if (sentimentLabel === "Positive") {
      summary.positive += 1;
    } else if (sentimentLabel === "Negative") {
      summary.negative += 1;
    } else {
      summary.neutral += 1;
    }
  }

  summary.averageScore = Number((scoreSum / summary.total).toFixed(2));

  if (summary.positive > summary.negative && summary.averageScore >= 0.35) {
    summary.label = "Positive";
  } else if (summary.negative > summary.positive && summary.averageScore <= -0.35) {
    summary.label = "Negative";
  }

  return summary;
};

export const buildSentimentAnalytics = (products = []) => {
  const allReviews = [];

  for (const product of Array.isArray(products) ? products : []) {
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    const category = normalizeProductCategory(product.category) || "Uncategorized";

    reviews.forEach((review) => {
      allReviews.push({
        ...attachReviewSentiment(review),
        productId: product._id,
        productTitle: product.title,
        category,
      });
    });
  }

  const summary = summarizeSentiment(allReviews);
  const positiveRate = summary.total ? (summary.positive / summary.total) * 100 : 0;
  const neutralRate = summary.total ? (summary.neutral / summary.total) * 100 : 0;
  const negativeRate = summary.total ? (summary.negative / summary.total) * 100 : 0;

  const productMap = new Map();
  const categoryMap = new Map();
  const monthMap = new Map();

  allReviews.forEach((review) => {
    const productKey = String(review.productId || "unknown");
    const productEntry = productMap.get(productKey) || {
      productId: productKey,
      productTitle: review.productTitle || "Product",
      category: review.category || "Uncategorized",
      totalReviews: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      averageScore: 0,
      scoreTotal: 0,
    };
    const categoryEntry = categoryMap.get(review.category) || {
      category: review.category || "Uncategorized",
      totalReviews: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      averageScore: 0,
      scoreTotal: 0,
    };
    const date = new Date(review.createdAt || review.updatedAt || Date.now());
    const monthKey = Number.isNaN(date.getTime())
      ? "Unknown"
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthEntry = monthMap.get(monthKey) || {
      month: monthKey,
      totalReviews: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      averageScore: 0,
      scoreTotal: 0,
    };

    [productEntry, categoryEntry, monthEntry].forEach((entry) => {
      entry.totalReviews += 1;
      entry.scoreTotal += Number(review.sentimentScore || 0);
      if (review.sentimentLabel === "Positive") entry.positive += 1;
      else if (review.sentimentLabel === "Negative") entry.negative += 1;
      else entry.neutral += 1;
      entry.averageScore = Number((entry.scoreTotal / entry.totalReviews).toFixed(2));
    });

    productMap.set(productKey, productEntry);
    categoryMap.set(review.category, categoryEntry);
    monthMap.set(monthKey, monthEntry);
  });

  const stripScoreTotal = ({ scoreTotal, ...entry }) => entry;

  return {
    ...summary,
    positiveRate: Number(positiveRate.toFixed(1)),
    neutralRate: Number(neutralRate.toFixed(1)),
    negativeRate: Number(negativeRate.toFixed(1)),
    productInsights: [...productMap.values()]
      .map(stripScoreTotal)
      .sort((a, b) => b.negative - a.negative || a.averageScore - b.averageScore),
    categoryInsights: [...categoryMap.values()]
      .map(stripScoreTotal)
      .sort((a, b) => a.averageScore - b.averageScore),
    trend: [...monthMap.values()]
      .map(stripScoreTotal)
      .sort((a, b) => a.month.localeCompare(b.month)),
  };
};

export const buildDashboardReviewHealth = (
  products = [],
  sentimentAnalytics = buildSentimentAnalytics(products)
) => {
  const productList = Array.isArray(products) ? products : [];
  const sentiment =
    sentimentAnalytics && typeof sentimentAnalytics === "object"
      ? sentimentAnalytics
      : buildSentimentAnalytics(productList);
  const allReviews = productList.flatMap((product) =>
    (Array.isArray(product.reviews) ? product.reviews : []).map((review) =>
      attachReviewSentiment(review)
    )
  );
  const totalReviews = Number(sentiment.total || 0);
  const averageRating = totalReviews
    ? allReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      totalReviews
    : 0;
  const positiveReviews = allReviews.filter(
    (review) => Number(review.rating || 0) >= 4
  ).length;
  const lowReviews = allReviews.filter(
    (review) => Number(review.rating || 0) <= 2
  ).length;
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = allReviews.filter(
      (review) => Number(review.rating || 0) === rating
    ).length;

    return {
      rating,
      count,
      percentage: totalReviews ? Number(((count / totalReviews) * 100).toFixed(1)) : 0,
    };
  });
  const categoryRatings = (sentiment.categoryInsights || [])
    .map((category) => {
      const reviewCount = Number(category.totalReviews || 0);
      const negative = Number(category.negative || 0);

      return {
        name: category.category || "Uncategorized",
        reviewCount,
        positive: Number(category.positive || 0),
        neutral: Number(category.neutral || 0),
        negative,
        averageSentimentScore: Number(category.averageScore || 0),
        negativeRate: reviewCount
          ? Number(((negative / reviewCount) * 100).toFixed(1))
          : 0,
      };
    })
    .filter((category) => category.negative > 0)
    .sort(
      (a, b) =>
        b.negativeRate - a.negativeRate ||
        b.negative - a.negative ||
        a.averageSentimentScore - b.averageSentimentScore ||
        b.reviewCount - a.reviewCount
    );

  return {
    totalReviews,
    averageRating: Number(averageRating.toFixed(2)),
    positiveReviewRate: totalReviews
      ? Number(((positiveReviews / totalReviews) * 100).toFixed(1))
      : 0,
    positiveSentimentRate: Number(sentiment.positiveRate || 0),
    negativeSentimentRate: Number(sentiment.negativeRate || 0),
    averageSentimentScore: Number(sentiment.averageScore || 0),
    sentimentCounts: {
      Positive: Number(sentiment.positive || 0),
      Neutral: Number(sentiment.neutral || 0),
      Negative: Number(sentiment.negative || 0),
    },
    lowReviews,
    unratedProducts: productList.filter(
      (product) => !Array.isArray(product.reviews) || product.reviews.length === 0
    ).length,
    ratingDistribution,
    categoryRatings,
  };
};
