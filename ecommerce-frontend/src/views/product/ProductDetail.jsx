import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../../context/useCart";
import { useAuth } from "../../context/useAuth";
import { useWishlist } from "../../context/useWishlist";
import { ArrowLeft, Baby } from "lucide-react";
import { useDarkMode } from "../../hooks";

// Components
import ProductImage from "../../components/product/ProductImage";
import ProductInfo from "../../components/product/ProductInfo";
import ReviewSection from "../../components/product/ReviewSection";
import LoginPrompt from "../../components/product/LoginPrompt";
import RelatedProducts from "../../components/product/RelatedProducts";
import Loading from "../../components/common/Loading";

// Hooks
import { useProductDetail, useProductReview } from "../../hooks/useProductDetail";
import { useLanguage } from "../../context/useLanguage";
import { requestProductBackScrollTop } from "../../utils/scrollIntent";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isDark] = useDarkMode();
  const { language } = useLanguage();

  // State
  const [quantity, setQuantity] = useState(1);

  // Custom hooks
  const { product, loading, error, refetch } = useProductDetail(id, user, language);
  const reviewData = useProductReview(id, user);

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

  const handleReviewSubmit = () => {
    reviewData.submitReview(() => {
      // Alert handled in hook or could be verified here, but context handles implementation details
      refetch();
    });
  };

  const handleBack = () => {
    requestProductBackScrollTop();
    navigate(-1);
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

  return (
    <div className={`min-h-screen pt-14 sm:pt-16 md:pt-22 pb-16 md:pb-0 font-sans transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-bg-base"}`}>


      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* Back Button */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={handleBack}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm shadow-sm transition-all duration-300 group active:scale-95 ${isDark ? "bg-slate-900 border-slate-700 hover:bg-slate-800" : "bg-white border-stone-200 hover:shadow-md hover:border-stone-300"}`}
            aria-label="Go back"
          >
            <ArrowLeft className={`h-4 w-4 transition-colors stroke-[2.5] ${isDark ? "text-slate-400 group-hover:text-white" : "text-stone-500 group-hover:text-stone-800"}`} />
            <span className={`font-bold transition-colors ${isDark ? "text-slate-300 group-hover:text-white" : "text-stone-600 group-hover:text-stone-900"}`}>Back</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 items-start gap-4 sm:gap-6 md:gap-10 mb-8 sm:mb-12">
          {/* Product Image Section */}
          <ProductImage
            product={product}
            onWishlist={handleWishlist}
            isInWishlist={isInWishlist(product._id)}
          />

          {/* Product Details Section */}
          <ProductInfo
            product={product}
            quantity={quantity}
            setQuantity={setQuantity}
            onAddToCart={handleAddToCart}
            user={user}
          />
        </div>

        <ReviewSection
          product={product}
          user={user}
          reviewData={reviewData}
          onSubmitReview={handleReviewSubmit}
        />

        {/* Related Products Section */}
        <RelatedProducts currentProduct={product} />

      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-slideDown { animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
