import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import { useWishlist } from "../../context/useWishlist";
import { ArrowLeft, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useDarkMode } from "../../hooks";

// Components
import ProductImage from "../../components/product/ProductImage";
import ProductInfo from "../../components/product/ProductInfo";
import ProductPurchaseActions from "../../components/product/ProductPurchaseActions";
import RelatedProducts from "../../components/product/RelatedProducts";
import Loading from "../../components/common/Loading";
import DualCurrencyPrice from "../../components/common/DualCurrencyPrice";
import SEO from "../../components/seo/SEO";

// Hooks
import { useProductDetail } from "../../hooks/useProductDetail";
import { useLanguage } from "../../context/useLanguage";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isDark] = useDarkMode();
  const { language, t } = useLanguage();

  // State
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // Custom hooks
  const { product, loading, error } = useProductDetail(id, user, language);

  const handleAddToCart = (options = {}) => {
    addToCart(product, quantity, options);
  };

  const handleWishlist = () => {
    if (product) {
      if (isInWishlist(product._id)) {
        removeFromWishlist(product._id);
      } else {
        addToWishlist(product);
      }
    }
  };

  if (loading) {
    return <Loading message="Loading product..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className={`text-center p-12 rounded-[3rem] shadow-2xl ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
          <p className="text-red-500 font-bold text-lg mb-4">Error loading product</p>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className={`text-center p-12 rounded-[3rem] shadow-2xl ${isDark ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
          <p className="text-text-muted font-bold text-lg">Product not found</p>
        </div>
      </div>
    );
  }

  const productJsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || product.images?.[0],
    sku: product._id,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: product.discountPrice || product.price,
      priceCurrency: "USD",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.rating ? {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.numReviews || 0,
    } : undefined,
  } : null
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);
  const displayPrice = discountPrice > 0 && discountPrice < price ? discountPrice : price;
  const isInStock = Number(product.stock || 0) > 0;

  return (
    <>
      <SEO
        title={product?.name || "Product Detail"}
        description={product?.description ? `${product.name} — ${product.description.substring(0, 160)}` : "View product details at Cherish Baby Store."}
        canonical={`/products/${id}`}
        ogImage={product?.image || product?.images?.[0]}
        ogType="product"
        jsonLd={productJsonLd}
      />
      <div className={`min-h-screen pt-14 sm:pt-16 md:pt-22 pb-16 md:pb-0 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>


      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Back Button */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm shadow-sm transition-all duration-300 group active:scale-95 ${isDark ? "bg-slate-900 border-slate-700 hover:bg-slate-800" : "bg-white border-stone-200 hover:shadow-md hover:border-stone-300"}`}
            aria-label="Go back"
          >
            <ArrowLeft className={`h-4 w-4 transition-colors stroke-[2.5] ${isDark ? "text-slate-400 group-hover:text-white" : "text-stone-500 group-hover:text-stone-800"}`} />
            <span className={`font-bold transition-colors ${isDark ? "text-slate-300 group-hover:text-white" : "text-stone-600 group-hover:text-stone-900"}`}>Back</span>
          </button>
        </div>

        <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(300px,0.95fr)_minmax(0,1fr)] xl:grid-cols-[minmax(360px,43%)_minmax(0,1fr)_minmax(275px,320px)] xl:gap-7 2xl:gap-9 mb-8 sm:mb-12">
          {/* Product Image Section */}
          <div className="min-w-0 space-y-3 sm:space-y-4 xl:sticky xl:top-[5.5rem] xl:z-10">
            <ProductImage
              product={product}
              selectedColor={selectedColor}
              onWishlist={handleWishlist}
              isInWishlist={isInWishlist(product._id)}
            />
          </div>

          {/* Product Details Section */}
          <div className="min-w-0">
            <ProductInfo
              product={product}
              quantity={quantity}
              setQuantity={setQuantity}
              onAddToCart={handleAddToCart}
              onLoginRequired={() => navigate("/login")}
              user={user}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              showCheckoutControls={false}
            />
          </div>

          <aside className="min-w-0 lg:col-span-2 xl:sticky xl:top-[5.5rem] xl:col-span-1 xl:z-10">
            <div className={`rounded-[1.35rem] border p-4 shadow-sm sm:p-5 xl:rounded-[1.15rem] ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-stone-200 bg-white"
            }`}>
              <div className={`border-b pb-4 ${isDark ? "border-slate-800" : "border-stone-100"}`}>
                <DualCurrencyPrice
                  amount={displayPrice}
                  className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 font-display text-3xl font-black tracking-normal ${
                    isDark ? "text-white" : "text-stone-900"
                  }`}
                  khrClassName="text-sm font-bold text-primary"
                  separator=""
                />
                <p className={`mt-3 text-sm font-bold leading-6 ${isDark ? "text-slate-300" : "text-text-muted"}`}>
                  {t("product.noImportChargesCheckout")}
                </p>
              </div>

              <div className={`space-y-3 border-b py-4 text-sm font-bold ${isDark ? "border-slate-800 text-slate-300" : "border-stone-100 text-text-muted"}`}>
                <div className="flex items-start gap-2.5">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{t("product.fastLocalDeliveryCambodia")}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{t("product.deliverSavedAddressCheckout")}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{t("product.secureCheckoutProtectedPayment")}</span>
                </div>
              </div>

              <p className={`py-4 text-xl font-black ${isInStock ? "text-primary-dark" : "text-rose-600"}`}>
                {isInStock ? t("product.inStock") : t("product.outOfStock")}
              </p>

              <ProductPurchaseActions
                product={product}
                quantity={quantity}
                setQuantity={setQuantity}
                onAddToCart={handleAddToCart}
                onLoginRequired={() => navigate("/login")}
                user={user}
                selectedSize={selectedSize}
                onSizeChange={setSelectedSize}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                showVariantOptions={false}
              />
            </div>
          </aside>
        </div>

        {/* Related Products Section */}
        <RelatedProducts currentProduct={product} />

      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-slideDown { animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
    </>
  );
}
