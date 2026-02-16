import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { ArrowLeft, ChevronRight } from "lucide-react";

// Components
import ProductImage from "../../components/product/ProductImage";
import ProductInfo from "../../components/product/ProductInfo";
import ReviewSection from "../../components/product/ReviewSection";
import RelatedProducts from "../../components/product/RelatedProducts";
import PastelCloudBackdrop from "../../components/ui/PastelCloudBackdrop";

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
  const imageRef = useRef(null);

  useEffect(() => {
    const availableStock = Number(product?.stock || 0);
    if (availableStock <= 0) {
      setQuantity(1);
      return;
    }

    if (quantity > availableStock) {
      setQuantity(availableStock);
    }
  }, [product?.stock, quantity]);

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    const availableStock = Number(product.stock || 0);
    if (availableStock <= 0) {
      return;
    }

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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base">
        <PastelCloudBackdrop />
        <div className="relative z-10 rounded-xl border border-primary/15 bg-white/95 p-8 text-center shadow-sm">
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base">
        <PastelCloudBackdrop />
        <div className="relative z-10 rounded-xl border border-primary/15 bg-white/95 p-8 text-center shadow-sm">
          <p className="text-red-500 font-bold text-lg mb-4">Error loading product</p>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base">
        <PastelCloudBackdrop />
        <div className="relative z-10 rounded-xl border border-primary/15 bg-white/95 p-8 text-center shadow-sm">
          <p className="text-text-muted font-bold text-lg">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base pt-24 font-sans">
      <PastelCloudBackdrop />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Home</span>
            <ChevronRight className="w-4 h-4" />
            <span>Products</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-text-main font-medium line-clamp-1">{product.title || product.name}</span>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-primary"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <ProductImage
            product={product}
            onWishlist={handleWishlist}
            isInWishlist={isInWishlist(product._id)}
            imageRef={imageRef}
          />

          <ProductInfo
            product={product}
            quantity={quantity}
            setQuantity={setQuantity}
            onAddToCart={handleAddToCart}
            user={user}
            imageRef={imageRef}
          />
        </div>

        <div className="mb-10 rounded-2xl border border-primary/15 bg-white/96 p-3.5 shadow-sm md:p-4">
          <ReviewSection
            product={product}
            user={user}
            reviewData={reviewData}
            onSubmitReview={handleReviewSubmit}
          />
        </div>

        <RelatedProducts currentProduct={product} />
      </div>
    </div>
  );
}
