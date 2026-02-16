import React from 'react';
import { Star } from 'lucide-react';

const ReviewList = ({ reviews }) => {
  return (
    <div className="space-y-3.5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-text-main md:text-2xl">Latest Reviews</h2>
        {reviews && reviews.length > 0 &&
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">Verified buyers</span>
        }
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="grid gap-3">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="rounded-2xl border border-primary/12 bg-white/96 p-3.5 shadow-sm transition-shadow hover:shadow-md md:p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/12 bg-blue-soft/35 text-sm font-bold text-primary">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-main md:text-base">{review.name}</div>
                    <div className="text-[11px] text-text-muted">
                      {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1">
                  <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                  <span className="text-xs font-semibold text-secondary">{review.rating}</span>
                </div>
              </div>
              <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-blue-soft/24 to-secondary-light/24 p-3">
                <p className="text-sm leading-relaxed text-text-muted">"{review.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/20 bg-white p-10 text-center">
          <div className="mb-4 text-primary/25">
            <Star className="mx-auto h-12 w-12" />
          </div>
          <p className="mb-1 text-lg font-bold text-text-main">No reviews yet</p>
          <p className="text-sm text-text-muted">Be the first parent to share feedback.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
