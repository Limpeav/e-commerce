import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Package, Send, Sparkles } from "lucide-react";
import { ProductController } from "../../controllers/productController";
import { useLanguage } from "../../context/useLanguage";
import { useDarkMode } from "../../hooks";
import AnimatedStarRating from "./AnimatedStarRating";

const getProductId = (item) => {
  const product = item?.product;
  return typeof product === "object" ? product?._id : product;
};

const getProductName = (item, fallback = "Delivered Product") =>
  item?.product?.title || item?.product?.name || item?.name || fallback;

const defaultReviewForm = {
  rating: 5,
  comment: "",
  error: "",
};

export default function PendingRatingGate({
  pendingOrders = [],
  user = null,
  onComplete = () => {},
}) {
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const [forms, setForms] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Extract all distinct items needing review from pending orders
  const itemsToRate = useMemo(() => {
    const list = [];
    const seenProductIds = new Set();

    pendingOrders.forEach((order) => {
      (order.orderItems || []).forEach((item) => {
        const pId = String(getProductId(item) || "");
        if (pId && !seenProductIds.has(pId)) {
          seenProductIds.add(pId);
          list.push({
            ...item,
            orderId: order._id,
            productId: pId,
          });
        }
      });
    });

    return list;
  }, [pendingOrders]);

  // Lock body scroll while modal is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleRatingChange = (productId, rating) => {
    setForms((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || defaultReviewForm),
        rating,
        error: "",
      },
    }));
  };

  const handleCommentChange = (productId, comment) => {
    setForms((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || defaultReviewForm),
        comment,
      },
    }));
  };

  const handleSubmitAll = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    // Validate all items have at least 1 star rating
    let hasError = false;
    const updatedForms = { ...forms };

    itemsToRate.forEach((item) => {
      const form = updatedForms[item.productId] || defaultReviewForm;
      if (!form.rating || form.rating < 1) {
        hasError = true;
        updatedForms[item.productId] = {
          ...form,
          error: t("reviewOrder.errors.chooseRating") || "Please select a rating",
        };
      }
    });

    if (hasError) {
      setForms(updatedForms);
      setErrorMessage(
        t("reviewOrder.errors.selectEveryRating") ||
          "Please select a rating for every product."
      );
      return;
    }

    setSubmitting(true);

    try {
      const results = await Promise.all(
        itemsToRate.map(async (item) => {
          const form = forms[item.productId] || defaultReviewForm;
          return ProductController.submitReview(item.productId, user, {
            rating: Number(form.rating || 5),
            comment: String(form.comment || "").trim(),
            orderId: item.orderId,
          });
        })
      );

      const anyFailed = results.some((r) => !r.success);
      if (anyFailed) {
        setErrorMessage(
          t("reviewOrder.errors.submitFailed") ||
            "Could not submit some ratings. Please try again."
        );
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setTimeout(() => {
        onComplete();
      }, 1400);
    } catch (err) {
      console.error("Error submitting ratings in gate:", err);
      setErrorMessage(err.message || "Failed to submit ratings.");
      setSubmitting(false);
    }
  };

  if (!itemsToRate.length) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      style={{ minHeight: "100dvh" }}
    >
      <div
        className={`w-full max-w-2xl my-auto rounded-3xl border shadow-2xl transition-all duration-300 overflow-hidden ${
          isDark
            ? "bg-slate-900 border-slate-700 text-slate-100"
            : "bg-white border-stone-100 text-stone-900"
        }`}
      >
        {submitted ? (
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-black mb-3">
              {t("reviewOrder.success.title") || "Thank You For Your Rating!"}
            </h3>
            <p className="text-sm sm:text-base font-bold text-text-muted max-w-md">
              {t("reviewOrder.success.message") ||
                "Your feedback helps us continuously improve our service and helps other families."}
            </p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-stone-100 dark:border-slate-800 bg-gradient-to-br from-amber-500/10 via-transparent to-primary/5">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Delivered Order Feedback
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-text-main">
                {t("reviewOrder.title") || "Rate Your Delivered Products"}
              </h2>
              <p className="mt-2 text-sm font-bold text-text-muted leading-relaxed">
                Your order has been delivered! Please take a quick moment to rate your
                items before continuing to the store.
              </p>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm font-bold">
                {errorMessage}
              </div>
            )}

            {/* Product items list */}
            <div className="p-6 sm:p-8 max-h-[55vh] overflow-y-auto space-y-6 divide-y divide-stone-100 dark:divide-slate-800">
              {itemsToRate.map((item, idx) => {
                const form = forms[item.productId] || defaultReviewForm;

                return (
                  <div
                    key={item.productId}
                    className={`${idx > 0 ? "pt-6" : ""} flex flex-col gap-4`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 overflow-hidden p-1.5 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={getProductName(item)}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-stone-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-black text-base sm:text-lg text-text-main truncate">
                          {getProductName(item)}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-bold text-text-muted">
                          {item.size && (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800">
                              Color: {item.color}
                            </span>
                          )}
                          <span>Qty: {item.quantity || 1}</span>
                        </div>
                      </div>
                    </div>

                    {/* Star rating picker */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">
                        {t("reviewOrder.rating") || "Rating"} *
                      </label>
                      <AnimatedStarRating
                        value={form.rating}
                        onChange={(val) => handleRatingChange(item.productId, val)}
                        isDark={isDark}
                        name={`rating-gate-${item.productId}`}
                      />
                      {form.error && (
                        <p className="mt-1.5 text-xs font-bold text-red-500">
                          {form.error}
                        </p>
                      )}
                    </div>

                    {/* Optional Comment */}
                    <div>
                      <label
                        htmlFor={`comment-${item.productId}`}
                        className="block text-xs font-black uppercase tracking-wider text-text-muted mb-2"
                      >
                        {t("reviewOrder.comment") || "Comment (Optional)"}
                      </label>
                      <textarea
                        id={`comment-${item.productId}`}
                        value={form.comment || ""}
                        onChange={(e) =>
                          handleCommentChange(item.productId, e.target.value)
                        }
                        rows={2}
                        maxLength={500}
                        placeholder={
                          t("reviewOrder.commentPlaceholder") ||
                          "How was this item? (optional)"
                        }
                        className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-bold outline-none transition-colors focus:ring-2 focus:ring-primary/20 ${
                          isDark
                            ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-primary"
                            : "border-stone-200 bg-stone-50/50 text-stone-900 placeholder:text-stone-400 focus:border-primary focus:bg-white"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Action */}
            <div className="p-6 sm:p-8 border-t border-stone-100 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-text-muted text-center sm:text-left">
                Rating all delivered items completes your review and unlocks full access to the store.
              </p>
              <button
                type="button"
                onClick={handleSubmitAll}
                disabled={submitting}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & Continue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
