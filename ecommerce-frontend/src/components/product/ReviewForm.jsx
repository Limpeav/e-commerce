import React from 'react';
import { Check } from 'lucide-react';

const ReviewForm = ({ reviewData, onSubmit }) => {
  const {
    rating,
    setRating,
    comment,
    setComment,
    submittingReview,
    reviewError,
    alreadyReviewed
  } = reviewData;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-text-main">Share your experience</h3>
      
      {alreadyReviewed ? (
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
          <div className="mb-2 flex items-center gap-2.5">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-semibold">Review submitted</span>
          </div>
          <p className="text-green-700/85">Thank you for helping other parents.</p>
        </div>
      ) : reviewError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">
          {reviewError}
        </div>
      ) : null}

      {!alreadyReviewed && (
        <>
          <div>
            <label className="mb-2 block text-xs font-semibold text-text-main">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm text-text-main transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Very good</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Fair</option>
              <option value="1">1 - Poor</option>
            </select>
          </div>
          
          <div>
            <label className="mb-2 block text-xs font-semibold text-text-main">Review</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other parents what you liked or did not like..."
              className="w-full rounded-xl border border-primary/20 bg-white p-3 text-sm text-text-main transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={submittingReview}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-text-main transition-colors hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </>
      )}
    </form>
  );
};

export default ReviewForm;
