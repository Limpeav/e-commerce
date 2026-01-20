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
  const [addedToCart, setAddedToCart] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Custom hooks
  const { product, loading, error, refetch } = useProductDetail(id, user);
  const reviewData = useProductReview(id, user);

  const handleAddToCart = () => {
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => {
        setShowLoginPrompt(false);
        navigate("/login");
      }, 2000);
      return;
    }

    addToCart(product, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleWishlist = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => {
        setShowLoginPrompt(false);
        navigate("/login");
      }, 2000);
      return;
    }

    if (product) {
      if (isInWishlist(product._id)) {
        await removeFromWishlist(product._id);
      } else {
        await addToWishlist(product);
      }
    }
  };

  const handleReviewSubmit = () => {
    reviewData.submitReview(() => {
      alert("Review submitted successfully!");
      refetch(); // Refresh product data
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
    <div className="min-h-screen bg-bg-base pt-28 font-sans">
      {/* Login Required Alert */}
      {showLoginPrompt && <LoginPrompt />}

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-primary font-medium text-sm mb-10 group transition-all bg-white px-5 py-2.5 rounded-full border border-stone-100 shadow-sm hover:shadow-md"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back
        </Link>

        <div className="grid lg:grid-cols-2 gap-16 mb-20">
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
            addedToCart={addedToCart}
            user={user}
          />
        </div>

        {/* Reviews Section */}
        <ReviewSection
          product={product}
          user={user}
          reviewData={reviewData}
          onSubmitReview={handleReviewSubmit}
        />
      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-slideDown { animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
