import { useState, useEffect } from 'react';
import { fetchProductById, createProductReview } from '../services/productApi';

export const useProductDetail = (id, user) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const data = await fetchProductById(id, user?.token);
      setProduct(data);
      
      // Set alreadyReviewed status from backend response
      if (data.alreadyReviewed !== undefined) {
        const storageKey = `reviewed_${user?.id}_${id}`;
        if (data.alreadyReviewed && user) {
          localStorage.setItem(storageKey, 'true');
        }
      }
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
      const storageKey = `reviewed_${user.id}_${id}`;
      const hasReviewed = localStorage.getItem(storageKey);
      if (hasReviewed === 'true') {
        setAlreadyReviewed(true);
      }
    }
  }, [user, id]);

  const submitReview = async (onSuccess) => {
    setSubmittingReview(true);
    setReviewError("");

    try {
      if (!user) {
        throw new Error("You must be logged in to submit a review");
      }

      if (!user.token) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      await createProductReview(id, { rating, comment }, user.token);

      // Save review status to localStorage
      const storageKey = `reviewed_${user.id}_${id}`;
      localStorage.setItem(storageKey, 'true');

      setRating(5);
      setComment("");
      setAlreadyReviewed(true);
      
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.message === "Product already reviewed") {
        setAlreadyReviewed(true);
        setReviewError("");
        if (user && id) {
          const storageKey = `reviewed_${user.id}_${id}`;
          localStorage.setItem(storageKey, 'true');
        }
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
