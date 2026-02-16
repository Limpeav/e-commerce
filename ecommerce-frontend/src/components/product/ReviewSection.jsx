import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Lock } from 'lucide-react';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

const ReviewSection = ({ 
  product, 
  user, 
  reviewData, 
  onSubmitReview 
}) => {
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
      <div className="lg:col-span-1">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-blue-soft/45 via-cream to-secondary-light/24 p-3.5 md:p-4">
          <h2 className="mb-3.5 text-lg font-bold text-text-main md:text-xl">Ratings & Reviews</h2>
          <div className="mb-3.5 flex items-center gap-3 rounded-xl border border-primary/12 bg-white/92 p-3 md:p-3.5">
            <div className="text-3xl font-bold text-primary">{product.rating?.toFixed(1) || "0.0"}</div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating || 0)
                      ? "fill-secondary text-secondary"
                      : "text-primary/20"
                      }`}
                  />
                ))}
              </div>
              <p className="text-xs text-text-muted">{product.numReviews} reviews</p>
            </div>
          </div>

          {user ? (
            <ReviewForm 
              reviewData={reviewData}
              onSubmit={onSubmitReview}
            />
          ) : (
            <div className="rounded-xl border border-primary/15 bg-white/92 p-3.5 text-center">
              <Lock className="mx-auto mb-3 h-6 w-6 text-text-muted/50" />
              <p className="mb-2 text-sm font-semibold text-text-main">Login to write a review</p>
              <Link to="/login" className="text-sm font-semibold text-primary hover:text-primary-hover">Go to Login</Link>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        <ReviewList reviews={product.reviews} />
      </div>
    </div>
  );
};

export default ReviewSection;
