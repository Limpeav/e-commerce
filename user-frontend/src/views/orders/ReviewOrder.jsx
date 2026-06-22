import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Send, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { getOrderById } from "../../services/orderService";
import { ProductController } from "../../controllers/productController";
import { useAuth } from "../../context/useAuth";
import { useDarkMode } from "../../hooks";
import Loading from "../../components/common/Loading";

const getProductId = (item) => {
  const product = item?.product;
  return typeof product === "object" ? product?._id : product;
};

const getProductName = (item) =>
  item?.product?.title || item?.product?.name || item?.name || "Purchased product";

const getReviewUserId = (review) => {
  const reviewUser = review?.user;
  return typeof reviewUser === "object" ? reviewUser?._id : reviewUser;
};

const getUserReviewForItem = (item, user) => {
  const userId = user?._id || user?.id;

  if (!userId || !Array.isArray(item?.product?.reviews)) {
    return null;
  }

  return item.product.reviews.find((review) => String(getReviewUserId(review)) === String(userId)) || null;
};

const uniqueOrderItems = (items = []) =>
  Array.from(
    new Map(
      items
        .filter((item) => getProductId(item))
        .map((item) => [String(getProductId(item)), item])
    ).values()
  );

export default function ReviewOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [isDark] = useDarkMode();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState({});
  const [submittingAll, setSubmittingAll] = useState(false);
  const [submittedByProduct, setSubmittedByProduct] = useState({});
  const [showThankYou, setShowThankYou] = useState(false);
  const redirectTimeoutRef = useRef(null);
  const focusedProductId = searchParams.get("product");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getOrderById(id);
        setOrder(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || loadError.message || "Unable to load this order.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const reviewItems = useMemo(() => {
    const items = uniqueOrderItems(order?.orderItems || []);

    if (!focusedProductId) {
      return items;
    }

    return [...items].sort((a, b) => {
      const aMatches = String(getProductId(a)) === focusedProductId;
      const bMatches = String(getProductId(b)) === focusedProductId;
      return Number(bMatches) - Number(aMatches);
    });
  }, [order?.orderItems, focusedProductId]);

  useEffect(() => {
    if (!reviewItems.length || !user) {
      return;
    }

    setForms((current) => {
      const next = { ...current };

      reviewItems.forEach((item) => {
        const productId = String(getProductId(item));
        const existingReview = getUserReviewForItem(item, user);

        if (existingReview && !next[productId]) {
          next[productId] = {
            rating: Number(existingReview.rating) || 0,
            comment: existingReview.comment || "",
          };
        }
      });

      return next;
    });

    setSubmittedByProduct((current) => {
      const next = { ...current };

      reviewItems.forEach((item) => {
        const productId = String(getProductId(item));

        if (getUserReviewForItem(item, user) && !next[productId]) {
          next[productId] = "existing";
        }
      });

      return next;
    });
  }, [reviewItems, user]);

  const setRating = (productId, rating) => {
    setForms((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        rating,
      },
    }));
  };

  const setComment = (productId, comment) => {
    setForms((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        comment,
      },
    }));
  };

  const submitAllReviews = async () => {
    const missingRatings = reviewItems
      .map((item) => String(getProductId(item)))
      .filter((productId) => !forms[productId]?.rating);

    if (missingRatings.length) {
      setForms((current) => {
        const next = { ...current };
        reviewItems.forEach((item) => {
          const productId = String(getProductId(item));
          next[productId] = {
            ...next[productId],
            error: missingRatings.includes(productId) ? "Please choose a rating." : "",
          };
        });
        return next;
      });
      window.alert("Please select a star rating for every product before submitting.");
      return;
    }

    setSubmittingAll(true);
    setForms((current) =>
      Object.fromEntries(
        Object.entries(current).map(([productId, form]) => [
          productId,
          { ...form, error: "" },
        ])
      )
    );

    const results = await Promise.all(
      reviewItems.map(async (item) => {
        const productId = String(getProductId(item));
        const form = forms[productId];
        const result = await ProductController.submitReview(productId, user, {
          rating: Number(form.rating),
          comment: form.comment || "",
        });
        return { productId, result };
      })
    );
    const failedResults = results.filter(({ result }) => !result.success);

    if (failedResults.length) {
      setForms((current) => {
        const next = { ...current };
        failedResults.forEach(({ productId, result }) => {
          next[productId] = {
            ...next[productId],
            error: result.error || "Failed to submit review.",
          };
        });
        return next;
      });
      setSubmittingAll(false);
      return;
    }

    setSubmittedByProduct((current) => {
      const next = { ...current };
      results.forEach(({ productId, result }) => {
        next[productId] =
          result.data?.updated || result.data?.alreadyReviewed ? "updated" : "submitted";
      });
      return next;
    });
    setSubmittingAll(false);
    setShowThankYou(true);

    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = window.setTimeout(() => {
      navigate("/customer", { replace: true });
    }, 3000);
  };

  const switchOrderAccount = () => {
    logout();
    navigate("/login", {
      state: { from: `/orders/${id}/review${window.location.search || ""}` },
      replace: true,
    });
  };

  if (loading) {
    return <Loading message="Loading review page..." />;
  }

  if (error || !order) {
    const isAuthorizationError = /not authorized/i.test(error);

    return (
      <div className={`min-h-screen px-4 py-24 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
        <div className={`mx-auto max-w-xl rounded-2xl border p-8 text-center ${isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-white"}`}>
          <p className="mb-4 text-lg font-black text-text-main">Review page unavailable</p>
          <p className="mb-6 text-sm font-bold leading-relaxed text-text-muted">
            {isAuthorizationError
              ? "This order belongs to a different customer account. Please sign in with the account that placed this order, then open the review link again."
              : error || "Order not found."}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isAuthorizationError && (
              <button
                type="button"
                onClick={switchOrderAccount}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-black text-white"
              >
                Sign in with order account
              </button>
            )}
            <Link to="/orders" className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-black ${isAuthorizationError ? "bg-stone-100 text-text-main" : "bg-primary text-white"}`}>
              Back to orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    const celebrationDots = [
      { x: -112, y: -72, color: "#E6BAA3", delay: 0.05 },
      { x: -82, y: 76, color: "#7A967E", delay: 0.12 },
      { x: 102, y: -78, color: "#E2B95F", delay: 0.18 },
      { x: 118, y: 48, color: "#8EA7B8", delay: 0.24 },
      { x: -132, y: 10, color: "#B38A9B", delay: 0.3 },
      { x: 72, y: 94, color: "#E6BAA3", delay: 0.36 },
    ];

    return (
      <main
        className={`relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-16 sm:px-6 sm:py-20 ${
          isDark ? "bg-slate-950" : "bg-bg-base"
        }`}
      >
        <motion.div
          aria-hidden="true"
          className={`absolute -left-24 top-[12%] h-64 w-64 rounded-full blur-3xl ${
            isDark ? "bg-emerald-500/10" : "bg-primary/10"
          }`}
          animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className={`absolute -right-24 bottom-[8%] h-72 w-72 rounded-full blur-3xl ${
            isDark ? "bg-amber-400/10" : "bg-secondary/20"
          }`}
          animate={reduceMotion ? undefined : { scale: [1.1, 0.95, 1.1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-xl overflow-hidden rounded-[1.75rem] border px-5 py-8 text-center shadow-2xl sm:rounded-[2.25rem] sm:px-10 sm:py-11 ${
            isDark
              ? "border-slate-800 bg-slate-900/95 shadow-black/30"
              : "border-stone-100 bg-white/95 shadow-stone-300/40"
          }`}
        >
          <div className="relative mx-auto mb-6 h-24 w-24 sm:h-28 sm:w-28">
            {!reduceMotion &&
              celebrationDots.map((dot, index) => (
                <motion.span
                  key={index}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3"
                  style={{ backgroundColor: dot.color }}
                  initial={{ x: -5, y: -5, scale: 0, opacity: 0 }}
                  animate={{
                    x: dot.x,
                    y: dot.y,
                    scale: [0, 1.15, 0.8],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 1.15, delay: dot.delay, ease: "easeOut" }}
                />
              ))}

            <motion.div
              initial={reduceMotion ? false : { scale: 0, rotate: -18 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 17, delay: 0.12 }}
              className="absolute inset-2 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-[0_14px_35px_rgba(5,150,105,0.22)] ring-8 ring-emerald-50 sm:inset-3"
            >
              <motion.div
                animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
              >
                <CheckCircle className="h-11 w-11 sm:h-13 sm:w-13" strokeWidth={2.4} />
              </motion.div>
            </motion.div>
          </div>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary sm:text-xs sm:tracking-[0.24em]"
          >
            Review submitted
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="font-display text-3xl font-black leading-tight tracking-tight text-text-main sm:text-4xl"
          >
            Thank you for your review
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.39 }}
            className="mx-auto mt-4 max-w-md text-sm font-bold leading-6 text-text-muted sm:text-base sm:leading-7"
          >
            Your feedback helps other customers choose with confidence.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`mx-auto mt-7 max-w-sm rounded-2xl p-4 ${
              isDark ? "bg-slate-800" : "bg-stone-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-text-muted">
              <span>Returning to home</span>
              <span>3 seconds</span>
            </div>
            <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-slate-700" : "bg-stone-200"}`}>
              <motion.div
                className="h-full origin-left rounded-full bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduceMotion ? 0 : 3, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.section>
      </main>
    );
  }

  return (
    <main className={`min-h-screen px-4 pb-20 pt-20 sm:px-6 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary">Delivered order</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-text-main sm:text-5xl">Rate your products</h1>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-text-muted sm:text-base">
            Share a quick rating for the products from order #{String(order._id).slice(-8).toUpperCase()}.
          </p>
        </header>

        <div className="grid gap-5">
          {reviewItems.map((item) => {
            const productId = String(getProductId(item));
            const form = forms[productId] || {};
            const submitted = submittedByProduct[productId];
            const hasExistingReview = submitted === "existing" || submitted === "updated";
            const statusLabel = submitted === "submitted"
              ? "Submitted"
              : submitted === "updated"
                ? "Review updated"
                : submitted === "existing"
                  ? "Already reviewed"
                  : "";

            return (
              <section
                key={productId}
                className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-white"}`}
              >
                <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                  <div className={`aspect-square overflow-hidden rounded-2xl border ${isDark ? "border-slate-800 bg-slate-800" : "border-stone-100 bg-stone-50"}`}>
                    {item.image ? (
                      <img src={item.image} alt={getProductName(item)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-9 w-9 text-text-muted" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-display text-xl font-black text-text-main">{getProductName(item)}</h2>
                        <p className="mt-1 text-xs font-black uppercase tracking-widest text-text-muted">
                          Quantity {item.quantity || 1}
                        </p>
                      </div>
                      {statusLabel && (
                        <span className="inline-flex h-9 items-center gap-2 rounded-full bg-green-50 px-4 text-xs font-black uppercase tracking-widest text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          {statusLabel}
                        </span>
                      )}
                    </div>

                    <div className="space-y-5">
                      {hasExistingReview && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold leading-relaxed ${
                          isDark ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-200" : "border-emerald-100 bg-emerald-50 text-emerald-800"
                        }`}>
                          You already rated this product. You can change the stars or review text, then update your review.
                        </div>
                      )}

                      {submitted === "submitted" && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold leading-relaxed ${
                          isDark ? "border-blue-900/60 bg-blue-950/30 text-blue-200" : "border-blue-100 bg-blue-50 text-blue-800"
                        }`}>
                          Review submitted for this product. You can continue with the next product, or update this one.
                        </div>
                      )}

                      <div>
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">Rating</p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setRating(productId, rating)}
                              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                                Number(form.rating) >= rating
                                  ? "border-amber-200 bg-amber-50 text-amber-500"
                                  : isDark
                                    ? "border-slate-700 bg-slate-800 text-slate-500 hover:text-amber-400"
                                    : "border-stone-200 bg-stone-50 text-stone-300 hover:text-amber-400"
                              }`}
                              aria-label={`${rating} star rating`}
                            >
                              <Star className="h-5 w-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-primary" htmlFor={`review-${productId}`}>
                          Your Review(optional)
                        </label>
                        <textarea
                          id={`review-${productId}`}
                          value={form.comment || ""}
                          onChange={(event) => setComment(productId, event.target.value)}
                          rows={4}
                          placeholder="Write your review here..."
                          className={`w-full resize-none rounded-2xl border-2 p-4 text-sm font-bold text-text-main outline-none transition-colors focus:border-primary ${
                            isDark ? "border-slate-700 bg-slate-800 placeholder:text-slate-500" : "border-stone-100 bg-stone-50 placeholder:text-stone-400"
                          }`}
                        />
                      </div>

                      {form.error && (
                        <p className="text-sm font-bold text-red-600">{form.error}</p>
                      )}

                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {reviewItems.length > 0 && (
          <div className={`sticky bottom-4 mt-6 rounded-2xl border p-4 shadow-xl backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-5 ${
            isDark
              ? "border-slate-700 bg-slate-900/95"
              : "border-stone-200 bg-white/95"
          }`}>
            <div className="mb-3 sm:mb-0">
              <p className="font-display text-lg font-black text-text-main">
                Ready to submit all reviews?
              </p>
              <p className="mt-1 text-xs font-bold text-text-muted">
                Add a rating for all {reviewItems.length} product{reviewItems.length === 1 ? "" : "s"} before submitting.
              </p>
            </div>
            <button
              type="button"
              onClick={submitAllReviews}
              disabled={submittingAll}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {submittingAll ? "Submitting all..." : "Submit all reviews"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
