import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Lock, Check } from 'lucide-react';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';

const ReviewSection = ({ 
  product, 
  user, 
  reviewData, 
  onSubmitReview 
}) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const reviewCount = product.numReviews || 0;

  return (
    <div className={`grid lg:grid-cols-3 gap-10 lg:gap-16 border-t pt-12 sm:pt-20 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
      {/* Review Stats & Form */}
      <div className="lg:col-span-1 space-y-10">
        <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_24px_60px_-28px_rgba(2,6,23,0.9)]" : "bg-white border-stone-50 shadow-2xl shadow-primary/5"}`}>
          <h2 className="text-2xl sm:text-3xl font-black text-text-main mb-6 sm:mb-8 font-display tracking-tight">{t("product.customerReviews")}</h2>
            <div className={`flex items-center gap-4 sm:gap-6 mb-8 sm:mb-10 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border ${isDark ? "bg-amber-500/10 border-amber-500/15" : "bg-amber-50/50 border-amber-100/50"}`}>
            <div className="text-5xl sm:text-6xl font-black text-amber-600 font-display tracking-tight">{product.rating?.toFixed(1) || "0.0"}</div>
            <div>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(product.rating || 0)
                      ? "fill-amber-400 text-amber-400"
                      : "text-amber-200 fill-amber-50"
                      }`}
                  />
                ))}
              </div>
              <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-stone-500"}`}>
                {t("product.basedOnReviews", { count: reviewCount })}
              </p>
            </div>
          </div>

          {user ? (
            <ReviewForm 
              reviewData={reviewData}
              onSubmit={onSubmitReview}
            />
          ) : (
            <div className={`border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-center ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
              <Lock className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-4 sm:mb-6 ${isDark ? "text-slate-500" : "text-stone-200"}`} />
              <p className="text-text-main font-black uppercase tracking-widest text-xs mb-4 leading-relaxed">{t("product.pleaseLoginToReview")}</p>
              <Link to="/login" className="text-primary font-black uppercase tracking-[0.2em] text-[10px] border-b-2 border-primary/20 hover:border-primary transition-all pb-1">{t("product.login")}</Link>
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
