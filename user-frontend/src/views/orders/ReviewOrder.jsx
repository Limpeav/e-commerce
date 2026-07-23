import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle, Home, Package, Send, ShoppingBag, Sparkles, Star } from "lucide-react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { getOrderById } from "../../services/orderService";
import { ProductController } from "../../controllers/productController";
import { useAuth } from "../../context/useAuth";
import { useDarkMode } from "../../hooks";
import { useLanguage } from "../../context/useLanguage";
import Loading from "../../components/common/Loading";
import AnimatedStarRating from "../../components/ui/AnimatedStarRating";

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

export default function ReviewOrder() {
  const { id } = useParams();
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
    const celebrationStars = [
      { x: -88, y: -56, delay: 0.08, size: "h-3.5 w-3.5" },
      { x: -64, y: 58, delay: 0.16, size: "h-3 w-3" },
      { x: 78, y: -66, delay: 0.22, size: "h-4 w-4" },
      { x: 92, y: 38, delay: 0.28, size: "h-3 w-3" },
      { x: -104, y: 8, delay: 0.34, size: "h-2.5 w-2.5" },
      { x: 48, y: 78, delay: 0.4, size: "h-3.5 w-3.5" },
    ];
    const submittedCount = reviewItems.length;

    return (
      <main
        className={`relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10 sm:px-6 ${
          isDark
            ? "bg-[linear-gradient(135deg,#111412_0%,#1A1C1B_48%,#242823_100%)]"
            : "bg-[linear-gradient(135deg,#FCF9F5_0%,#F7F1EA_47%,#FDF7F2_100%)]"
        }`}
      >
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${
            isDark
              ? "bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]"
              : "bg-[linear-gradient(rgba(122,150,126,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(122,150,126,0.08)_1px,transparent_1px)]"
          } bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_76%,transparent)]`}
        />
        <Motion.div
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-24 ${
            isDark ? "bg-primary/10" : "bg-primary/10"
          }`}
          initial={reduceMotion ? false : { opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        <Motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full max-w-3xl overflow-hidden rounded-lg border shadow-2xl ${
            isDark
              ? "border-slate-800/90 bg-slate-900/95 shadow-black/35"
              : "border-white/90 bg-white/95 shadow-stone-300/45"
          }`}
        >
          <Motion.div
            aria-hidden="true"
            className={`absolute left-0 right-0 top-0 h-1.5 ${isDark ? "bg-primary" : "bg-primary"}`}
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left" }}
          />

          <div className="grid items-stretch md:grid-cols-[0.88fr_1.12fr]">
            <div
              className={`relative flex min-h-[260px] items-center justify-center overflow-hidden border-b p-8 md:border-b-0 md:border-r ${
                isDark
                  ? "border-slate-800 bg-slate-950/45"
                  : "border-stone-100 bg-[linear-gradient(160deg,#F7F1EA,#FFFFFF)]"
              }`}
            >
              <Motion.div
                aria-hidden="true"
                className="absolute -left-16 top-10 h-32 w-56 rotate-[-24deg] bg-secondary/25 blur-2xl"
                animate={reduceMotion ? undefined : { x: [0, 16, 0], opacity: [0.45, 0.72, 0.45] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <Motion.div
                aria-hidden="true"
                className="absolute -right-20 bottom-8 h-32 w-64 rotate-[-20deg] bg-primary/18 blur-2xl"
                animate={reduceMotion ? undefined : { x: [0, -18, 0], opacity: [0.38, 0.68, 0.38] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative h-44 w-44">
            {!reduceMotion &&
              celebrationStars.map((star, index) => (
                <Motion.div
                  key={index}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 text-secondary"
                  initial={{ x: -6, y: -6, scale: 0, rotate: -30, opacity: 0 }}
                  animate={{
                    x: star.x,
                    y: star.y,
                    scale: [0, 1.05, 0.82],
                    rotate: [0, 16, -8],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 1.25, delay: star.delay, ease: "easeOut" }}
                >
                  <Star className={`${star.size} fill-current`} />
                </Motion.div>
              ))}

            <Motion.div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-primary/20"
                  initial={reduceMotion ? false : { scale: 0.78, opacity: 0 }}
                  animate={{ scale: [0.78, 1, 1.08], opacity: [0, 0.7, 0] }}
                  transition={{ duration: 1.5, delay: 0.22, ease: "easeOut" }}
                />
                <Motion.div
                  aria-hidden="true"
                  className="absolute inset-6 rounded-full border border-primary/25"
                  initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: [0.8, 1, 1.12], opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.55, delay: 0.34, ease: "easeOut" }}
                />

                <Motion.div
                  initial={reduceMotion ? false : { scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 230, damping: 18, delay: 0.12 }}
                  className="absolute inset-10 flex items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_45px_rgba(122,150,126,0.38)] ring-[14px] ring-primary/12"
            >
              <Motion.div
                    animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.35, repeat: Infinity, repeatDelay: 0.95 }}
              >
                    <CheckCircle className="h-14 w-14" strokeWidth={2.25} />
              </Motion.div>
            </Motion.div>
          </div>
            </div>

            <div className="relative px-6 py-8 text-center sm:px-9 sm:py-10 md:text-left">
          <Motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="mb-3 inline-flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary sm:text-xs"
          >
                <Sparkles className="h-4 w-4" />
            {t("reviewOrder.success.badge")}
          </Motion.p>
          <Motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-4xl font-black leading-tight tracking-tight text-text-main sm:text-5xl"
          >
            {t("reviewOrder.success.title")}
          </Motion.h1>
          <Motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="mx-auto mt-4 max-w-md text-sm font-bold leading-6 text-text-muted sm:text-base sm:leading-7 md:mx-0"
          >
                {t("reviewOrder.success.message")}
          </Motion.p>

          <Motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1 }}
                transition={{ delay: 0.48 }}
                className={`mt-6 grid grid-cols-2 overflow-hidden rounded-lg border ${
                  isDark ? "border-slate-800 bg-slate-950/30" : "border-stone-100 bg-stone-50/70"
                }`}
          >
                <div className={`border-r p-4 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                  <p className="text-2xl font-black text-text-main">{submittedCount}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-text-muted">
                    {submittedCount === 1
                      ? t("reviewOrder.success.productReviewed")
                      : t("reviewOrder.success.productsReviewed")}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-2xl font-black text-text-main">3s</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-text-muted">
                    {t("reviewOrder.success.autoReturn")}
                  </p>
                </div>
              </Motion.div>

              <Motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58 }}
                className="mt-6"
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-text-muted">
                  <span>{t("reviewOrder.success.returningHome")}</span>
                  <span>{t("reviewOrder.success.almostThere")}</span>
            </div>
                <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-slate-800" : "bg-stone-100"}`}>
              <Motion.div
                    className="h-full origin-left rounded-full bg-primary"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduceMotion ? 0 : 3, ease: "linear" }}
              />
            </div>
          </Motion.div>

              <Motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.68 }}
                className="mt-7 flex flex-col gap-3 sm:flex-row"
              >
                <button
                  type="button"
                  onClick={() => navigate("/customer", { replace: true })}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-dark active:translate-y-0"
                >
                  <Home className="h-4 w-4" />
                  {t("reviewOrder.success.continueShopping")}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  to="/customer/orders"
                  className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border px-5 text-sm font-black transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      : "border-stone-200 bg-white text-text-main hover:bg-stone-50"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  {t("reviewOrder.success.viewOrders")}
                </Link>
              </Motion.div>
            </div>
          </div>
        </Motion.section>
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
                  <div className={`aspect-square overflow-hidden rounded-2xl border ${isDark ? "border-slate-800 bg-slate-800" : "border-stone-100 bg-stone-50"}`}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={getProductName(item, t("reviewOrder.purchasedProduct"))}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
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
