import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { ArrowLeft, Baby } from "lucide-react";

// Components
import ProductImage from "../../components/product/ProductImage";
import ProductInfo from "../../components/product/ProductInfo";
import ReviewSection from "../../components/product/ReviewSection";
import LoginPrompt from "../../components/product/LoginPrompt";
import RelatedProducts from "../../components/product/RelatedProducts";

// Hooks
import { useProductDetail, useProductReview } from "../../hooks/useProductDetail";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // State
  const [quantity, setQuantity] = useState(1);

  // Custom hooks
  const { product, loading, error, refetch } = useProductDetail(id, user);
  const reviewData = useProductReview(id, user);

  const handleAddToCart = () => {
    addToCart(product, quantity);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-[3rem] shadow-2xl">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-text-muted font-medium text-sm animate-pulse">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-[3rem] shadow-2xl">
          <p className="text-red-500 font-bold text-lg mb-4">Error loading product</p>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center bg-white p-12 rounded-[3rem] shadow-2xl">
          <p className="text-text-muted font-bold text-lg">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base pt-16 sm:pt-20 md:pt-28 pb-20 md:pb-0 font-sans">


      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-10">
        {/* Back Button */}
        {/* Back Button */}
        <div className="mb-4 sm:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-110 active:scale-95 transition-all duration-300 group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-stone-600 group-hover:text-primary transition-colors stroke-[2.5]" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 md:gap-16 mb-10 sm:mb-20">
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
