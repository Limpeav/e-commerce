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
import AlreadyRatedCard from "../../components/ui/AlreadyRatedCard";
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
  const [showAlreadyRated, setShowAlreadyRated] = useState(false);
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

    const onlyAlreadyRatedResults = results.every(({ result }) =>
      result.data?.updated || result.data?.alreadyReviewed
    );

    if (onlyAlreadyRatedResults) {
      setShowAlreadyRated(true);
      return;
    }

    setShowThankYou(true);

    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = window.setTimeout(() => {
      navigate("/", { replace: true });
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

  if (showAlreadyRated) {
    return (
      <main
        className={`flex min-h-[100dvh] items-center justify-center px-4 py-12 ${
          isDark ? "bg-slate-950" : "bg-[#f6f7fb]"
        }`}
      >
        <AlreadyRatedCard onDismiss={() => navigate("/", { replace: true })} />
      </main>
    );
  }

  if (showThankYou) {
    const submittedCount = reviewItems.length;

    // Confetti particle data — generated once per render of this block
    const confettiParticles = [
      { x: -130, y: -90,  delay: 0.05, size: 8,  color: "#7a967e", rotate: 30  },
      { x: -95,  y: 110,  delay: 0.1,  size: 6,  color: "#a8c5ac", rotate: -20 },
      { x: 120,  y: -100, delay: 0.15, size: 10, color: "#5c8460", rotate: 15  },
      { x: 145,  y: 60,   delay: 0.2,  size: 7,  color: "#d4a574", rotate: -40 },
      { x: -160, y: 20,   delay: 0.25, size: 5,  color: "#b8dbbf", rotate: 25  },
      { x: 60,   y: 130,  delay: 0.3,  size: 9,  color: "#7a967e", rotate: -15 },
      { x: -60,  y: -130, delay: 0.08, size: 6,  color: "#e8c49a", rotate: 45  },
      { x: 170,  y: -30,  delay: 0.18, size: 8,  color: "#a8c5ac", rotate: -35 },
      { x: -180, y: -50,  delay: 0.28, size: 5,  color: "#7a967e", rotate: 60  },
      { x: 100,  y: -150, delay: 0.12, size: 7,  color: "#5c8460", rotate: -50 },
      { x: -40,  y: 160,  delay: 0.35, size: 9,  color: "#d4a574", rotate: 20  },
      { x: 190,  y: 100,  delay: 0.22, size: 5,  color: "#b8dbbf", rotate: -10 },
    ];

    return (
      <main
        className={`relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-12 sm:px-6 ${
          isDark
            ? "bg-[linear-gradient(145deg,#0d1110_0%,#141816_50%,#1a2019_100%)]"
            : "bg-[linear-gradient(145deg,#f0ede8_0%,#faf7f3_50%,#f5f0ea_100%)]"
        }`}
      >
        {/* Animated background blobs */}
        <Motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
          animate={reduceMotion ? undefined : {
            scale: [1, 1.18, 1],
            opacity: [0.35, 0.6, 0.35],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <Motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
          animate={reduceMotion ? undefined : {
            scale: [1, 1.22, 1],
            opacity: [0.3, 0.55, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <Motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
          animate={reduceMotion ? undefined : {
            y: [0, -20, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />

        {/* Subtle dot grid */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${
            isDark
              ? "bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)]"
              : "bg-[radial-gradient(rgba(122,150,126,0.12)_1px,transparent_1px)]"
          } bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]`}
        />

        <Motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-2xl"
        >
          {/* Main card */}
          <div
            className={`relative overflow-hidden rounded-3xl border shadow-2xl ${
              isDark
                ? "border-white/8 bg-white/4 shadow-black/50 backdrop-blur-xl"
                : "border-white/70 bg-white/80 shadow-stone-400/25 backdrop-blur-xl"
            }`}
          >
            {/* Top accent bar with animated gradient */}
            <Motion.div
              aria-hidden="true"
              className="absolute left-0 right-0 top-0 h-1 bg-[linear-gradient(90deg,#5c8460,#7a967e,#a8c5ac,#7a967e,#5c8460)] bg-[size:200%_100%]"
              initial={reduceMotion ? false : { scaleX: 0, backgroundPosition: "0% 0%" }}
              animate={{ scaleX: 1, backgroundPosition: "200% 0%" }}
              transition={{ scaleX: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }, backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" } }}
              style={{ transformOrigin: "left" }}
            />

            <div className="px-8 pb-8 pt-10 sm:px-12 sm:pb-10 sm:pt-12">
              {/* Hero section */}
              <div className="flex flex-col items-center text-center">

                {/* Icon cluster with confetti */}
                <div className="relative mb-8 h-36 w-36">
                  {/* Confetti burst */}
                  {!reduceMotion && confettiParticles.map((p, i) => (
                    <Motion.div
                      key={i}
                      aria-hidden="true"
                      className="absolute left-1/2 top-1/2 rounded-sm"
                      style={{ width: p.size, height: p.size, backgroundColor: p.color }}
                      initial={{ x: -p.size / 2, y: -p.size / 2, scale: 0, rotate: 0, opacity: 0 }}
                      animate={{
                        x: p.x,
                        y: p.y,
                        scale: [0, 1.2, 0.85],
                        rotate: p.rotate,
                        opacity: [0, 1, 0],
                      }}
                      transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
                    />
                  ))}

                  {/* Pulsing rings */}
                  {!reduceMotion && [0, 1, 2].map((i) => (
                    <Motion.div
                      key={i}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full border border-primary/30"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: [0.6, 1.5], opacity: [0.7, 0] }}
                      transition={{ duration: 2, delay: i * 0.45 + 0.1, repeat: Infinity, ease: "easeOut" }}
                    />
                  ))}

                  {/* Icon circle */}
                  <Motion.div
                    initial={reduceMotion ? false : { scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
                    className="absolute inset-6 flex items-center justify-center rounded-full bg-primary text-white shadow-[0_20px_60px_rgba(92,132,96,0.45)]"
                  >
                    <Motion.div
                      animate={reduceMotion ? undefined : { scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <CheckCircle className="h-12 w-12" strokeWidth={2.25} />
                    </Motion.div>
                  </Motion.div>
                </div>

                {/* Badge */}
                <Motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("reviewOrder.success.badge")}
                </Motion.div>

                {/* Title */}
                <Motion.h1
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.38 }}
                  className="font-display text-4xl font-black leading-tight tracking-tight text-text-main sm:text-5xl"
                >
                  {t("reviewOrder.success.title")}
                </Motion.h1>

                {/* Message */}
                <Motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.46 }}
                  className="mx-auto mt-4 max-w-sm text-sm font-bold leading-7 text-text-muted sm:text-base"
                >
                  {t("reviewOrder.success.message")}
                </Motion.p>
              </div>

              {/* Divider */}
              <Motion.div
                initial={reduceMotion ? false : { opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.52, duration: 0.5 }}
                className={`my-8 h-px origin-center ${isDark ? "bg-white/8" : "bg-stone-200/80"}`}
              />

              {/* Reviewed products strip */}
              {reviewItems.length > 0 && (
                <Motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.56 }}
                  className="mb-8"
                >
                  <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.2em] text-primary">
                    {submittedCount === 1
                      ? t("reviewOrder.success.productReviewed")
                      : t("reviewOrder.success.productsReviewed")}
                  </p>
                  <div className="flex flex-col gap-3">
                    {reviewItems.map((item) => {
                      const productId = String(getProductId(item));
                      const form = forms[productId] || {};
                      const stars = Number(form.rating) || 5;
                      return (
                        <div
                          key={productId}
                          className={`flex items-center gap-4 rounded-2xl border p-3.5 ${
                            isDark
                              ? "border-white/8 bg-white/4"
                              : "border-stone-100 bg-stone-50/70"
                          }`}
                        >
                          {/* Product image */}
                          <div
                            className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl border ${
                              isDark ? "border-white/10 bg-slate-800" : "border-stone-200 bg-white"
                            }`}
                          >
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={getProductName(item)}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-5 w-5 text-text-muted" />
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-text-main">
                              {getProductName(item, t("reviewOrder.purchasedProduct"))}
                            </p>
                            {/* Star display */}
                            <div className="mt-1 flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3.5 w-3.5 ${
                                    s <= stars
                                      ? "fill-amber-400 text-amber-400"
                                      : isDark
                                        ? "fill-slate-700 text-slate-700"
                                        : "fill-stone-200 text-stone-200"
                                  }`}
                                />
                              ))}
                              <span className="ml-1.5 text-[11px] font-bold text-text-muted">
                                {stars}/5
                              </span>
                            </div>
                          </div>
                          {/* Check badge */}
                          <div className="shrink-0 rounded-full bg-primary/12 p-1.5">
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Motion.div>
              )}

              {/* Progress bar — auto-return */}
              <Motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.64 }}
                className="mb-7"
              >
                <div className="mb-2.5 flex items-center justify-between text-xs font-black uppercase tracking-[0.14em] text-text-muted">
                  <span>{t("reviewOrder.success.returningHome")}</span>
                  <span>{t("reviewOrder.success.almostThere")}</span>
                </div>
                <div className={`h-2 overflow-hidden rounded-full ${isDark ? "bg-white/8" : "bg-stone-200"}`}>
                  <Motion.div
                    className="h-full origin-left rounded-full bg-[linear-gradient(90deg,#5c8460,#7a967e)]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 3, ease: "linear" }}
                  />
                </div>
              </Motion.div>

              {/* CTA buttons */}
              <Motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72 }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <button
                  type="button"
                  id="review-success-continue-shopping"
                  onClick={() => navigate("/", { replace: true })}
                  className="group relative inline-flex h-13 flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary px-6 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0"
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <Home className="h-4 w-4 shrink-0" />
                  <span>{t("reviewOrder.success.continueShopping")}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>

                <Link
                  id="review-success-view-orders"
                  to="/customer/orders"
                  className={`group inline-flex h-13 flex-1 items-center justify-center gap-2.5 rounded-2xl border px-6 text-sm font-black transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                    isDark
                      ? "border-white/12 bg-white/5 text-slate-100 hover:bg-white/10"
                      : "border-stone-200 bg-white text-text-main hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>{t("reviewOrder.success.viewOrders")}</span>
                </Link>
              </Motion.div>
            </div>
          </div>

          {/* Bottom attribution */}
          <Motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 text-center text-xs font-bold text-text-muted"
          >
            {t("reviewOrder.success.returningHome")} &mdash; {t("reviewOrder.success.almostThere")}
          </Motion.p>
        </Motion.div>
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
