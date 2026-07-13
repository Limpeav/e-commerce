import RatingReviewList from "./RatingReviewList";

const PositiveReviews = () => (
  <RatingReviewList
    title="Positive Reviews"
    description="Products with customer reviews classified as Positive by AI sentiment analysis."
    emptyMessage="No positive sentiment reviews found."
    sentimentFilter="Positive"
    tone="green"
  />
);

export default PositiveReviews;
