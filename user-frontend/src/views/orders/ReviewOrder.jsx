import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Send, Star } from "lucide-react";
import { getOrderById } from "../../services/orderService";
import { ProductController } from "../../controllers/productController";
import { useAuth } from "../../context/useAuth";
import { useDarkMode } from "../../hooks";
import { useLanguage } from "../../context/useLanguage";
import Loading from "../../components/common/Loading";
import AlreadyRatedCard from "../../components/ui/AlreadyRatedCard";
import AnimatedStarRating from "../../components/ui/AnimatedStarRating";
import { portalConfig } from "../../utils/portalConfig";

const getProductId = (item) => {
  const product = item?.product;
  return typeof product === "object" ? product?._id : product;
};

const getProductName = (item, fallback = "Purchased product") =>
  item?.product?.title || item?.product?.name || item?.name || fallback;

const getReviewUserId = (review) => {
  const reviewUser = review?.user;
  return typeof reviewUser === "object" ? reviewUser?._id : reviewUser;
};

const getUserReviewForItem = (item, user) => {
  const userId = user?._id || user?.id;

  if (!userId || !Array.isArray(item?.product?.reviews)) {
    return null;
  }

  return item.product.reviews.find(
    (review) => String(getReviewUserId(review)) === String(userId)
  ) || null;
};

const uniqueOrderItems = (items = []) =>
  Array.from(
    new Map(
      items
        .filter((item) => getProductId(item))
        .map((item) => [String(getProductId(item)), item])
    ).values()
  );

const getReviewCompleteHomeUrl = () => {
  const customerUrl = portalConfig.customerUrl || "https://cherishbabykhstore.store";
  return customerUrl.endsWith("/") ? customerUrl : `${customerUrl}/`;
};

export default function ReviewOrder() {
  const { id, productId: routeProductId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const [isDark] = useDarkMode();
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState({});
  const [submittingAll, setSubmittingAll] = useState(false);
  const [submittedByProduct, setSubmittedByProduct] = useState({});
  const [showThankYou, setShowThankYou] = useState(false);
  const focusedProductId = searchParams.get("product") || routeProductId;

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getOrderById(id);
        setOrder(data);
      } catch (loadError) {
        if (loadError.response?.status === 401) {
          const returnPath = `${location.pathname}${location.search}${location.hash}`;
          logout();
          navigate("/login", { replace: true, state: { from: returnPath } });
          return;
        }

        setError(loadError.response?.data?.message || loadError.message || t("reviewOrder.errors.loadOrder"));
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, location.hash, location.pathname, location.search, logout, navigate, t]);

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

        if (!next[productId]) {
          next[productId] = {
            rating: existingReview ? Number(existingReview.rating) || 5 : 5,
            comment: existingReview?.comment || "",
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
            error: missingRatings.includes(productId) ? t("reviewOrder.errors.chooseRating") : "",
          };
        });
        return next;
      });
      window.alert(t("reviewOrder.errors.selectEveryRating"));
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
          comment: String(form.comment || "").trim(),
          orderId: id,
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
            error: result.error || t("reviewOrder.errors.submitFailed"),
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
  };

  const switchOrderAccount = () => {
    logout();
    navigate("/login", {
      state: { from: `${location.pathname}${location.search}${location.hash}` },
      replace: true,
    });
  };

  const goToCustomerHome = () => {
    if (typeof window === "undefined") {
      navigate("/", { replace: true });
      return;
    }

    const homeUrl = new URL(getReviewCompleteHomeUrl(), window.location.href);

    if (homeUrl.origin === window.location.origin) {
      navigate(`${homeUrl.pathname}${homeUrl.search}${homeUrl.hash}` || "/", {
        replace: true,
      });
      return;
    }

    window.location.assign(homeUrl.href);
  };

  if (loading) {
    return <Loading message={t("reviewOrder.loading")} />;
  }

  if (error || !order) {
    const isAuthorizationError = /not authorized/i.test(error);

    return (
      <div className={`min-h-screen px-4 py-24 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
        <div className={`mx-auto max-w-xl rounded-2xl border p-8 text-center ${isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-white"}`}>
          <p className="mb-4 text-lg font-black text-text-main">{t("reviewOrder.errors.pageUnavailable")}</p>
          <p className="mb-6 text-sm font-bold leading-relaxed text-text-muted">
            {isAuthorizationError
              ? t("reviewOrder.errors.wrongAccount")
              : error || t("reviewOrder.errors.orderNotFound")}
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isAuthorizationError && (
              <button
                type="button"
                onClick={switchOrderAccount}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-black text-white"
              >
                {t("reviewOrder.signInOrderAccount")}
              </button>
            )}
            <Link to="/orders" className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-black ${isAuthorizationError ? "bg-stone-100 text-text-main" : "bg-primary text-white"}`}>
              {t("reviewOrder.backToOrders")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    return (
      <main
        className={`flex min-h-[100dvh] items-center justify-center px-4 py-12 ${
          isDark ? "bg-slate-950" : "bg-[#f6f7fb]"
        }`}
      >
        <AlreadyRatedCard onDismiss={goToCustomerHome} />
      </main>
    );
  }

  return (
    <main className={`min-h-screen px-4 pb-20 pt-20 sm:px-6 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-primary">{t("reviewOrder.deliveredOrder")}</p>
          <h1 className="font-display text-3xl font-black tracking-tight text-text-main sm:text-5xl">{t("reviewOrder.title")}</h1>
          <p className="mt-4 max-w-2xl text-sm font-bold leading-relaxed text-text-muted sm:text-base">
            {t("reviewOrder.subtitle", { orderNumber: String(order._id).slice(-8).toUpperCase() })}
          </p>
        </header>

        <div className="grid gap-5">
          {reviewItems.map((item) => {
            const productId = String(getProductId(item));
            const form = forms[productId] || {};
            const submitted = submittedByProduct[productId];
            const hasExistingReview = submitted === "existing" || submitted === "updated";
            const statusLabel = submitted === "submitted"
              ? t("reviewOrder.status.submitted")
              : submitted === "updated"
                ? t("reviewOrder.status.updated")
                : submitted === "existing"
                  ? t("reviewOrder.status.existing")
                  : "";

            return (
              <section
                key={productId}
                className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${isDark ? "border-slate-800 bg-slate-900" : "border-stone-100 bg-white"}`}
              >
                <div className="grid gap-5 md:grid-cols-[120px_1fr]">
                  <div className={`aspect-square overflow-hidden rounded-2xl border p-2 ${isDark ? "border-slate-800 bg-slate-800" : "border-stone-100 bg-stone-50"}`}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={getProductName(item, t("reviewOrder.purchasedProduct"))}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-9 w-9 text-text-muted" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-display text-xl font-black text-text-main">{getProductName(item, t("reviewOrder.purchasedProduct"))}</h2>
                        <p className="mt-1 text-xs font-black uppercase tracking-widest text-text-muted">
                          {t("reviewOrder.quantity", { count: item.quantity || 1 })}
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
                          {t("reviewOrder.notices.alreadyRated")}
                        </div>
                      )}

                      {submitted === "submitted" && (
                        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold leading-relaxed ${
                          isDark ? "border-blue-900/60 bg-blue-950/30 text-blue-200" : "border-blue-100 bg-blue-50 text-blue-800"
                        }`}>
                          {t("reviewOrder.notices.submitted")}
                        </div>
                      )}

                      <div>
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">{t("reviewOrder.rating")}</p>
                        <AnimatedStarRating
                          value={form.rating}
                          onChange={(rating) => setRating(productId, rating)}
                          isDark={isDark}
                          name={`rating-${productId}`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`comment-${productId}`}
                          className="mb-3 block text-xs font-black uppercase tracking-[0.2em] text-primary"
                        >
                          {t("reviewOrder.comment")}
                        </label>
                        <textarea
                          id={`comment-${productId}`}
                          value={form.comment || ""}
                          onChange={(event) => setComment(productId, event.target.value)}
                          rows={4}
                          maxLength={600}
                          placeholder={t("reviewOrder.commentPlaceholder")}
                          className={`min-h-28 w-full resize-y rounded-2xl border px-4 py-3 text-sm font-bold leading-relaxed outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                            isDark
                              ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
                              : "border-stone-200 bg-white text-text-main placeholder:text-text-muted"
                          }`}
                        />
                        <p className="mt-2 text-xs font-bold text-text-muted">
                          {t("reviewOrder.commentHint")}
                        </p>
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
                {t("reviewOrder.readyTitle")}
              </p>
              <p className="mt-1 text-xs font-bold text-text-muted">
                {t("reviewOrder.submitHint", { count: reviewItems.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={submitAllReviews}
              disabled={submittingAll}
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {submittingAll ? t("reviewOrder.submittingAll") : t("reviewOrder.submitAll")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
