import RatingReviewList from "./RatingReviewList";

const AllReviews = () => (
  <RatingReviewList
    title="Total Reviews"
    description="All products that have customer star ratings."
    emptyMessage="No product reviews found."
    minRating={1}
    maxRating={5}
    tone="green"
  />
);

export default AllReviews;
