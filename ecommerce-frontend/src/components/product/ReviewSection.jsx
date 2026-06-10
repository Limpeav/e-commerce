import React from 'react';
import { Star } from 'lucide-react';
import ReviewList from './ReviewList';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';

const ReviewSection = ({ product }) => {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const reviewCount = product.numReviews || 0;

  return (
    <section
      id="reviews"
      className={`scroll-mt-24 border-t pt-12 sm:pt-20 ${isDark ? "border-slate-800" : "border-stone-100"}`}
    >
        <div className="mb-6 sm:mb-8">
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-black tracking-tight text-text-main sm:text-3xl">
                {t("product.customerReviews")}
              </h2>
              {reviewCount > 0 && (
                <span className="rounded-full bg-primary/10 px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary sm:text-[10px]">
                  {t("product.verifiedReviews")}
                </span>
              )}
            </div>

            <div className={`flex items-center gap-4 rounded-[1.5rem] border p-4 sm:gap-6 sm:rounded-[2rem] sm:p-6 ${
              isDark
                ? "border-amber-500/15 bg-amber-500/10"
                : "border-amber-100/50 bg-amber-50/50"
            }`}>
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
          </div>
        </div>

        <ReviewList reviews={product.reviews} />
    </section>
  );
};

export default ReviewSection;
