import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Lock, Check } from 'lucide-react';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

const ReviewSection = ({ 
  product, 
  user, 
  reviewData, 
  onSubmitReview 
}) => {
  return (
    <div className="grid lg:grid-cols-3 gap-10 lg:gap-16 border-t border-stone-100 pt-12 sm:pt-20">
      {/* Review Stats & Form */}
      <div className="lg:col-span-1 space-y-10">
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl shadow-primary/5 border border-stone-50">
          <h2 className="text-2xl sm:text-3xl font-black text-text-main mb-6 sm:mb-8 font-display tracking-tight">Parental Notes</h2>
          <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-10 bg-stone-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem]">
            <div className="text-5xl sm:text-6xl font-black text-primary font-display tracking-tight">{product.rating?.toFixed(1) || "0.0"}</div>
            <div>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(product.rating || 0)
                      ? "fill-secondary text-secondary"
                      : "text-stone-200"
                      }`}
                  />
                ))}
              </div>
              <p className="text-text-muted text-[10px] sm:text-xs font-black uppercase tracking-widest">Consensus: {product.numReviews} Votes</p>
            </div>
          </div>

          {user ? (
            <ReviewForm 
              reviewData={reviewData}
              onSubmit={onSubmitReview}
            />
          ) : (
            <div className="bg-stone-50 border border-stone-100 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-center">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-stone-200 mx-auto mb-4 sm:mb-6" />
              <p className="text-text-main font-black uppercase tracking-widest text-xs mb-4 leading-relaxed">Identity verification needed <br /> to submit notes</p>
              <Link to="/login" className="text-primary font-black uppercase tracking-[0.2em] text-[10px] border-b-2 border-primary/20 hover:border-primary transition-all pb-1">Enter Here</Link>
            </div>
          )}
        </div>
      </div>

      {/* Review List */}
      <div className="lg:col-span-2">
        <ReviewList reviews={product.reviews} />
      </div>
    </div>
  );
};

export default ReviewSection;
