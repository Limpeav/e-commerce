import React from 'react';
import { Star } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';

const ReviewList = ({ reviews }) => {
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();
  const dateLocale = language === "kh" ? "km-KH" : undefined;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h2 className="text-2xl sm:text-3xl font-black text-text-main font-display tracking-tight">{t("product.customerReviews")}</h2>
        {reviews && reviews.length > 0 &&
          <span className="text-[9px] sm:text-[10px] font-black text-primary bg-primary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-[0.2em]">{t("product.verifiedReviews")}</span>
        }
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="grid gap-4 sm:gap-6">
          {reviews.map((review) => (
            <div key={review._id} className={`rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-500 ${isDark ? "bg-slate-900 border-slate-800 hover:shadow-[0_24px_60px_-28px_rgba(79,70,229,0.35)]" : "bg-white border-stone-100 shadow-sm hover:shadow-xl hover:shadow-primary/5"}`}>
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 border rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center text-primary font-black text-lg sm:text-xl ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-text-main text-base sm:text-lg font-display tracking-tight">{review.name}</div>
                    <div className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-stone-400"}`}>
                      {new Date(review.createdAt).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100/50"}`}>
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-500" />
                  <span className="text-xs font-black text-amber-600">{review.rating}</span>
                </div>
              </div>
              <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50/50 border-stone-100/50"}`}>
                <p className="text-text-muted leading-relaxed font-bold italic text-sm sm:text-base">"{review.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`rounded-[2.5rem] sm:rounded-[4rem] p-10 sm:p-20 text-center border-2 border-dashed ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-100"}`}>
          <div className={`mb-6 sm:mb-8 ${isDark ? "text-slate-700" : "text-stone-100"}`}>
            <Star className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
          </div>
          <p className="text-text-main font-black text-xl sm:text-2xl font-display mb-2 sm:mb-3 tracking-tight">{t("product.noReviewsYet")}</p>
          <p className="text-text-muted font-bold text-base sm:text-lg">{t("product.firstReview")}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
