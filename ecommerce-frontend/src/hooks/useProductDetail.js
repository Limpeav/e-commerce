import { useState, useEffect } from "react";
import { ProductController } from "../controllers/productController";

export const useProductDetail = (id, user) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await ProductController.getProductDetail(id, user);

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch product");
      }

      setProduct(result.data);
    } catch (err) {
      setError(err.message || "Failed to fetch product");
      console.error("Failed to fetch product", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id, user]);

  return { product, loading, error, refetch: fetchProduct };
};

export const useProductReview = (id, user) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Check localStorage for existing review on component mount
  useEffect(() => {
    if (user && id) {
      if (ProductController.hasReviewed(user._id || user.id, id)) {
        setAlreadyReviewed(true);
      }
    }
  }, [user, id]);

  const submitReview = async (onSuccess) => {
    setSubmittingReview(true);
    setReviewError("");

    try {
      const result = await ProductController.submitReview(id, user, {
        rating,
        comment,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setRating(5);
      setComment("");
      setAlreadyReviewed(true);

      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.message === "Product already reviewed") {
        setAlreadyReviewed(true);
        setReviewError("");
      } else {
        setReviewError(err.message || "An error occurred. Please try again.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  return {
    rating,
    setRating,
    comment,
    setComment,
    submittingReview,
    reviewError,
    alreadyReviewed,
    submitReview
  };
};
