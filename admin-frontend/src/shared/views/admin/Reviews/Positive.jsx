import RatingReviewList from "./RatingReviewList";

const PositiveReviews = () => (
  <RatingReviewList
    title="Positive Reviews"
    description="Products rated 4 or 5 stars by customers."
    emptyMessage="No 4 or 5 star reviews found."
    minRating={4}
    maxRating={5}
    tone="green"
  />
);

export default PositiveReviews;
