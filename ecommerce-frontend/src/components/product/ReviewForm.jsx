import React from 'react';
import { Star, Check } from 'lucide-react';

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
    <form onSubmit={onSubmit} className="space-y-6">
      <h3 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Write a Review</h3>
      
      {alreadyReviewed ? (
        <div className="bg-green-50 text-green-700 p-6 rounded-[2rem] text-sm border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <Check className="w-5 h-5 text-green-600 font-black" />
            <span className="font-black uppercase tracking-widest">Review Submitted</span>
          </div>
          <p className="font-bold opacity-80">Thank you for your feedback!</p>
        </div>
      ) : reviewError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100">
          {reviewError}
        </div>
      ) : null}

      {!alreadyReviewed && (
        <>
          <div>
            <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 focus:outline-none focus:border-primary transition-all font-black text-text-main"
            >
              <option value="5">5 - Exceptional</option>
              <option value="4">4 - High Quality</option>
              <option value="3">3 - Satisfactory</option>
              <option value="2">2 - Improving</option>
              <option value="1">1 - Substandard</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 ml-1">Your Review</label>
            <textarea
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review here..."
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl p-5 focus:outline-none focus:border-primary transition-all text-text-main font-bold placeholder:font-normal"
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={submittingReview}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all transform active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
          >
            {submittingReview ? "Submitting..." : "Submit Review"}
          </button>
        </>
      )}
    </form>
  );
};

export default ReviewForm;
