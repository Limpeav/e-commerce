import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Loading from "../../components/common/Loading";
import ReviewSection from "../../components/product/ReviewSection";
import SEO from "../../components/seo/SEO";
import { useAuth } from "../../context/useAuth";
import { useLanguage } from "../../context/useLanguage";
import { useDarkMode } from "../../hooks";
import { useProductDetail } from "../../hooks/useProductDetail";
import { getLocalizedProductText } from "../../utils/productLocalization";

export default function ProductReviews() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [isDark] = useDarkMode();
  const { product, loading, error } = useProductDetail(id, user, language);
  const productPath = `/products/${id}`;

  const handleBackToProduct = () => {
    if (location.state?.fromProductDetail) {
      navigate(-1);
      return;
    }

    navigate(productPath, { replace: true });
  };

  if (loading) {
    return <Loading message="Loading reviews..." />;
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-base px-4 pt-20">
        <div className={`w-full max-w-md rounded-3xl border p-8 text-center ${
          isDark ? "border-slate-800 bg-slate-900" : "border-stone-200 bg-white"
        }`}>
          <p className="font-bold text-red-500">{error || "Product not found"}</p>
          <button
            type="button"
            onClick={handleBackToProduct}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("product.backToProduct")}
          </button>
        </div>
      </main>
    );
  }

  const localizedProduct = getLocalizedProductText(product, language);

  return (
    <>
      <SEO
        title={t("product.reviewsForProduct", { product: localizedProduct.title })}
        description={`Customer reviews for ${localizedProduct.title} at Cherish Baby Store.`}
        canonical={`/products/${id}/reviews`}
        ogImage={product.image || product.images?.[0]}
      />

      <main className={`min-h-screen pb-16 pt-20 transition-colors sm:pt-24 ${
        isDark ? "bg-slate-950" : "bg-bg-base"
      }`}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <button
            type="button"
            onClick={handleBackToProduct}
            className={`mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black transition-colors ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-primary hover:text-primary"
                : "border-stone-200 bg-white text-stone-600 hover:border-primary hover:text-primary"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("product.backToProduct")}
          </button>

          <section className={`mb-8 grid gap-5 rounded-[2rem] border p-5 sm:grid-cols-[140px_1fr] sm:items-center sm:p-7 ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-stone-200 bg-white shadow-xl shadow-primary/5"
          }`}>
            <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-2xl ${
              isDark ? "bg-slate-800" : "bg-stone-50"
            }`}>
              <img
                src={product.image || product.images?.[0]}
                alt={localizedProduct.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-primary">
                {t("product.customerReviews")}
              </p>
              <h1 className="font-display text-2xl font-black leading-tight text-text-main sm:text-4xl">
                {localizedProduct.title}
              </h1>
              <button
                type="button"
                onClick={handleBackToProduct}
                className="mt-4 inline-flex text-sm font-bold text-text-muted underline underline-offset-4 transition-colors hover:text-primary"
              >
                {t("product.backToProduct")}
              </button>
            </div>
          </section>

          <ReviewSection product={product} />
        </div>
      </main>
    </>
  );
}
