import RatingReviewList from "./RatingReviewList";

const NegativeReviews = () => (
  <RatingReviewList
    title="Negative Reviews"
    description="Products rated 1 or 2 stars that need attention."
    emptyMessage="No 1 or 2 star reviews found."
    minRating={1}
    maxRating={2}
    tone="red"
  />
);

export default NegativeReviews;
