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
]);

const DAMPENERS = new Set(["slightly", "little", "somewhat", "kinda", "kindof"]);

const normalizeText = (value = "") => value.toString().trim().toLowerCase();

const tokenize = (text) => {
  const normalized = normalizeText(text).replace(/[^a-z0-9\s']/g, " ");
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
