import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { useDarkMode } from '../../hooks';
import { useLanguage } from '../../context/useLanguage';
import { translateTextRealtime } from '../../services/realtime';

const KHMER_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const isKhmerLanguage = (language = "") =>
  ["kh", "km"].includes(String(language).toLowerCase());

const getReviewKey = (review, index) =>
  String(review?._id || `${review?.name || "review"}-${review?.createdAt || index}`);

const getReviewTranslationKey = (review, index) =>
  `${getReviewKey(review, index)}:${String(review?.comment || "").trim()}`;

const formatReviewDate = (value, language) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (isKhmerLanguage(language)) {
    return `${KHMER_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }

  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const ReviewList = ({ reviews }) => {
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();
  const [translatedComments, setTranslatedComments] = useState({});
  const translationCacheRef = useRef({});
  const inFlightTranslationsRef = useRef(new Set());
  const sortedReviews = useMemo(
    () => [...(reviews || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    ),
    [reviews]
  );
  const reviewComments = useMemo(
    () => sortedReviews
      .map((review, index) => ({
        key: getReviewTranslationKey(review, index),
        comment: String(review.comment || "").trim(),
      }))
      .filter(({ comment }) => comment),
    [sortedReviews]
  );

  useEffect(() => {
    if (!isKhmerLanguage(language)) {
      return undefined;
    }

    let isCancelled = false;
    const pendingComments = reviewComments.filter(({ key }) =>
      !translationCacheRef.current[key] && !inFlightTranslationsRef.current.has(key)
    );

    if (!pendingComments.length) {
      return undefined;
    }

    pendingComments.forEach(({ key }) => inFlightTranslationsRef.current.add(key));

    Promise.allSettled(
      pendingComments.map(async ({ key, comment }) => {
        const result = await translateTextRealtime({
          text: comment,
          targetLanguage: "km",
          sourceLanguage: "auto",
        });
        return [key, String(result.translatedText || "").trim()];
      })
    ).then((results) => {
      const nextTranslations = {};

      results.forEach((result) => {
        if (result.status !== "fulfilled") return;

        const [key, translatedText] = result.value;
        if (!translatedText) return;

        translationCacheRef.current[key] = translatedText;
        nextTranslations[key] = translatedText;
      });

      if (!isCancelled && Object.keys(nextTranslations).length) {
        setTranslatedComments((current) => ({
          ...current,
          ...nextTranslations,
        }));
      }
    }).finally(() => {
      pendingComments.forEach(({ key }) => inFlightTranslationsRef.current.delete(key));
    });

    return () => {
      isCancelled = true;
    };
  }, [language, reviewComments]);

  return (
    <div>
      {sortedReviews.length > 0 ? (
        <div className="grid gap-4 sm:gap-6">
          {sortedReviews.map((review, index) => {
            const reviewKey = getReviewKey(review, index);
            const reviewTranslationKey = getReviewTranslationKey(review, index);
            const comment = String(review.comment || "").trim();
            const storedKhmerComment = String(review.commentKm || "").trim();
            const displayComment = isKhmerLanguage(language)
              ? storedKhmerComment || translatedComments[reviewTranslationKey] || comment
              : comment;
            const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 0)));

            return (
              <div key={reviewKey} className={`rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-500 ${isDark ? "bg-slate-900 border-slate-800 hover:shadow-[0_24px_60px_-28px_rgba(79,70,229,0.35)]" : "bg-white border-stone-100 shadow-sm hover:shadow-xl hover:shadow-primary/5"}`}>
                <div className={`flex justify-between items-start ${comment ? "mb-4 sm:mb-6" : ""}`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-14 sm:h-14 border rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center text-primary font-black text-lg sm:text-xl ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-100"}`}>
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-text-main text-base sm:text-lg font-display tracking-tight">{review.name}</div>
                      <div className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-stone-400"}`}>
                        {formatReviewDate(review.createdAt, language)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-0.5 sm:gap-1 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-100/50"}`}
                    aria-label={`${rating} out of 5 stars`}
                  >
                    <span className="mr-1 text-xs font-black text-amber-600">{rating}</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-500"
                            : isDark
                              ? "fill-transparent text-slate-600"
                              : "fill-transparent text-amber-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {comment && (
                  <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50/50 border-stone-100/50"}`}>
                    <p className="text-text-muted leading-relaxed font-bold italic text-sm sm:text-base">"{displayComment}"</p>
                  </div>
                )}
              </div>
            );
          })}

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
