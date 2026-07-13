import RatingReviewList from "./RatingReviewList";

const AllReviews = () => (
  <RatingReviewList
    title="Total Reviews"
    description="All products that have customer reviews and AI sentiment results."
    emptyMessage="No product reviews found."
    sentimentFilter="all"
    tone="green"
  />
);

export default AllReviews;
