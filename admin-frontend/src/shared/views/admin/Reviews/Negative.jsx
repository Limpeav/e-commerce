import RatingReviewList from "./RatingReviewList";

const NegativeReviews = () => (
  <RatingReviewList
    title="Negative Reviews"
    description="Products with customer reviews classified as Negative and needing attention."
    emptyMessage="No negative sentiment reviews found."
    sentimentFilter="Negative"
    tone="red"
  />
);

export default NegativeReviews;
