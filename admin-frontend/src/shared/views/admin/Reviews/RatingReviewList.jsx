import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Loading from "../../../components/common/Loading";
import { ProductController } from "../../../controllers";
import { getAvailableStock } from "../../../utils/adminProducts";
import { getMatchingSearchSuggestions, uniqueSearchSuggestions } from "../../../utils/searchSuggestions";

const RatingStars = ({ rating }) => (
  <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${
          star <= rating
            ? "fill-[#e2b95f] text-[#e2b95f]"
            : "fill-gray-100 text-gray-300"
        }`}
      />
    ))}
    <span className="ml-1 text-sm font-bold text-gray-700">{rating}/5</span>
  </div>
);

const getSentimentLabel = (review) => {
  if (["Positive", "Neutral", "Negative"].includes(review?.sentimentLabel)) {
    return review.sentimentLabel;
  }

  const rating = Number(review?.rating || 0);
  if (rating >= 4) return "Positive";
  if (rating <= 2) return "Negative";
  return "Neutral";
};

const sentimentClasses = {
  Positive: "border-green-200 bg-green-50 text-green-700",
  Neutral: "border-gray-200 bg-gray-50 text-gray-700",
  Negative: "border-red-200 bg-red-50 text-red-700",
};

const RatingReviewList = ({
  title,
  description,
  emptyMessage,
  sentimentFilter = "all",
  tone = "green",
}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await ProductController.getProducts();
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Failed to load product reviews"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedProduct(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProduct]);

  const reviewedProducts = useMemo(
    () =>
      products.flatMap((product) => {
        const matchingReviews = (
          Array.isArray(product.reviews) ? product.reviews : []
        ).filter((review) => {
          if (sentimentFilter === "all") return true;
          return getSentimentLabel(review) === sentimentFilter;
        });

        if (matchingReviews.length === 0) return [];

        const averageRating =
          matchingReviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
          ) / matchingReviews.length;
        return [
          {
            productId: product._id,
            productImage: product.image,
            productTitle: product.title,
            product,
            averageRating,
            reviewCount: matchingReviews.length,
            matchingReviews,
            sentimentCounts: matchingReviews.reduce(
              (counts, review) => {
                counts[getSentimentLabel(review)] += 1;
                return counts;
              },
              { Positive: 0, Neutral: 0, Negative: 0 }
            ),
          },
        ];
      }),
    [products, sentimentFilter]
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return reviewedProducts;

    return reviewedProducts.filter(
      (product) =>
        product.productTitle?.toLowerCase().includes(query) ||
        product.productId?.toLowerCase().includes(query)
    );
  }, [reviewedProducts, searchTerm]);
  const searchSuggestions = useMemo(
    () =>
      getMatchingSearchSuggestions(
        uniqueSearchSuggestions(
          reviewedProducts.flatMap((product) => [
            product.productTitle,
            product.productId,
          ])
        ),
        searchTerm,
        8
      ),
    [reviewedProducts, searchTerm]
  );

  if (loading) {
    return <Loading message="Loading product reviews..." />;
  }

  const isPositive = tone === "green";
  const countClasses = isPositive
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="mb-5 inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-gray-950">{title}</h1>
              <p className="mt-1 text-sm font-medium text-gray-600">{description}</p>
            </div>
            <div className={`rounded-2xl border px-5 py-3 ${countClasses}`}>
              <p className="text-xs font-bold uppercase tracking-wide">Products</p>
              <p className="text-3xl font-black">{reviewedProducts.length}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              list="admin-review-search-suggestions"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by product title or product ID..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <datalist id="admin-review-search-suggestions">
              {searchSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 font-semibold text-red-700">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <Star className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-bold text-gray-800">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Product
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Rating
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Sentiment
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.productId}>
                      <td className="px-5 py-4 align-top">
                        <div className="flex min-w-64 items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                            {product.productImage ? (
                              <img
                                src={product.productImage}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-950">
                              {product.productTitle}
                            </p>
                            <p className="mt-1 font-mono text-xs text-gray-500">
                              ID: {product.productId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <RatingStars
                          rating={Number(product.averageRating.toFixed(1))}
                        />
                        <p className="mt-2 text-xs font-semibold text-gray-500">
                          {product.reviewCount} matching review
                          {product.reviewCount === 1 ? "" : "s"}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          {["Positive", "Neutral", "Negative"].map((label) => (
                            product.sentimentCounts[label] > 0 ? (
                              <span
                                key={label}
                                className={`rounded-full border px-2.5 py-1 text-xs font-black ${sentimentClasses[label]}`}
                              >
                                {label}: {product.sentimentCounts[label]}
                              </span>
                            ) : null
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product.product)}
                          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-700"
                        >
                          Open Product
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close product information"
            onClick={() => setSelectedProduct(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Product Information
                </p>
                <h2 className="mt-1 text-xl font-black text-gray-950">
                  {selectedProduct.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-xl bg-gray-100 p-2 text-gray-600 transition hover:bg-gray-200 hover:text-gray-950"
                aria-label="Close product information"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-bold text-gray-400">
                    No product image
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-500">Price</p>
                  <p className="mt-1 text-lg font-black text-gray-950">
                    ${Number(selectedProduct.discountPrice || selectedProduct.price || 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-xs font-bold uppercase text-green-700">Available</p>
                  <p className="mt-1 text-lg font-black text-green-800">
                    {getAvailableStock(selectedProduct)}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase text-gray-500">Total stock</p>
                  <p className="mt-1 text-lg font-black text-gray-950">
                    {Number(selectedProduct.stock || 0)}
                  </p>
                </div>
                <div className="rounded-xl bg-orange-50 p-4">
                  <p className="text-xs font-bold uppercase text-orange-700">Issues</p>
                  <p className="mt-1 text-lg font-black text-orange-800">
                    {selectedProduct.hasProductIssue
                      ? Number(selectedProduct.issueQuantity || 0)
                      : 0}
                  </p>
                </div>
              </div>

              <dl className="mt-6 space-y-4 rounded-2xl border border-gray-200 p-5">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Product ID
                  </dt>
                  <dd className="mt-1 break-all font-mono text-sm text-gray-800">
                    {selectedProduct._id}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Category
                  </dt>
                  <dd className="mt-1 font-bold text-gray-900">
                    {selectedProduct.category || "Uncategorized"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Overall Rating
                  </dt>
                  <dd className="mt-2">
                    <RatingStars rating={Number(selectedProduct.rating || 0)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    AI Sentiment Summary
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {["Positive", "Neutral", "Negative"].map((label) => {
                      const count = (Array.isArray(selectedProduct.reviews)
                        ? selectedProduct.reviews
                        : []
                      ).filter((review) => getSentimentLabel(review) === label).length;

                      return (
                        <span
                          key={label}
                          className={`rounded-full border px-3 py-1 text-xs font-black ${sentimentClasses[label]}`}
                        >
                          {label}: {count}
                        </span>
                      );
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Recent Review Sentiment
                  </dt>
                  <dd className="mt-2 space-y-3">
                    {(Array.isArray(selectedProduct.reviews)
                      ? selectedProduct.reviews
                      : []
                    )
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt || 0).getTime() -
                          new Date(a.createdAt || 0).getTime()
                      )
                      .slice(0, 5)
                      .map((review) => {
                        const label = getSentimentLabel(review);

                        return (
                          <div key={review._id || `${review.user}-${review.createdAt}`} className="rounded-xl bg-gray-50 p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-gray-900">{review.name || "Customer"}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${sentimentClasses[label]}`}>
                                {label}
                              </span>
                            </div>
                            <p className="line-clamp-3 text-sm leading-5 text-gray-600">
                              {review.comment || "No written comment."}
                            </p>
                          </div>
                        );
                      })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-600">
                    {selectedProduct.description || "No description available."}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/products/edit/${selectedProduct._id}`)
                }
                className="w-full rounded-xl bg-gray-950 px-5 py-3 font-bold text-white transition hover:bg-gray-800"
              >
                Edit Product
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default RatingReviewList;
