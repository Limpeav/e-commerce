import React from "react";
import { Heart } from "lucide-react";

const ProductImage = ({ product, onWishlist, isInWishlist, imageRef }) => {
  const imageSrc = product.image || product.images?.[0] || "https://via.placeholder.com/600x600?text=No+Image";
  const imageAlt = product.title || product.name || "Product image";

  return (
    <div className="sticky top-28 rounded-2xl border border-primary/15 bg-white/96 p-3 shadow-sm md:p-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-primary/12 bg-gradient-to-b from-white via-blue-soft/28 to-secondary-light/26">
        <img ref={imageRef} src={imageSrc} alt={imageAlt} className="h-full w-full object-contain p-3 md:p-4" />

        <button
          type="button"
          onClick={onWishlist}
          className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
            isInWishlist
              ? "border-secondary bg-secondary text-white"
              : "border-primary/15 bg-white text-text-muted hover:border-secondary hover:text-secondary"
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  );
};

export default ProductImage;
