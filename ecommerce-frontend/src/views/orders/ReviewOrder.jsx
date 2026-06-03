import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Send, Star } from "lucide-react";
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
  const [submittingByProduct, setSubmittingByProduct] = useState({});
  const [submittedByProduct, setSubmittedByProduct] = useState({});
  const focusedProductId = searchParams.get("product");

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

  const submitReview = async (item) => {
    const productId = String(getProductId(item));
    const form = forms[productId] || {};

    if (!form.rating) {
      window.alert("Please select a star rating before submitting your review.");
      setForms((current) => ({
        ...current,
        [productId]: {
          ...current[productId],
          error: "Please choose a rating.",
        },
      }));
      return;
    }

    setSubmittingByProduct((current) => ({ ...current, [productId]: true }));
    setForms((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        error: "",
      },
    }));

    const result = await ProductController.submitReview(productId, user, {
      rating: Number(form.rating),
      comment: form.comment || "",
    });

    if (!result.success) {
      setForms((current) => ({
        ...current,
        [productId]: {
          ...current[productId],
          error: result.error || "Failed to submit review.",
        },
      }));
      setSubmittingByProduct((current) => ({ ...current, [productId]: false }));
      return;
    }

    setSubmittedByProduct((current) => ({
      ...current,
      [productId]: result.data?.updated || result.data?.alreadyReviewed ? "updated" : "submitted",
    }));
    setSubmittingByProduct((current) => ({ ...current, [productId]: false }));
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
            const isSubmitting = submittingByProduct[productId];
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

                      <button
                        type="button"
                        onClick={() => submitReview(item)}
                        disabled={isSubmitting}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Submitting..." : hasExistingReview || submitted === "submitted" ? "Update review" : "Submit review"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
