import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { ReviewController } from "../../../controllers";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

const badgeStyles = {
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Approved: "bg-green-50 text-green-700 border-green-100",
  Rejected: "bg-red-50 text-red-700 border-red-100",
};

const ReviewsModeration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingReviewId, setSavingReviewId] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [queue, setQueue] = useState([]);
  const [counts, setCounts] = useState({ Pending: 0, Approved: 0, Rejected: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await ReviewController.getQueue({
        status: statusFilter || undefined,
        page,
        limit: 20,
      });

      const payload = response.data || {};
      setQueue(Array.isArray(payload.items) ? payload.items : []);
      setCounts(payload.counts || { Pending: 0, Approved: 0, Rejected: 0 });
      setPagination(
        payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleModeration = async (review, nextStatus) => {
    const note =
      nextStatus === "Rejected"
        ? window.prompt("Optional rejection note:", review.moderationNote || "") || ""
        : "";

    try {
      setSavingReviewId(review.reviewId);
      await ReviewController.moderate(review.productId, review.reviewId, {
        status: nextStatus,
        moderationNote: note,
      });
      await fetchQueue();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to update moderation");
    } finally {
      setSavingReviewId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/reports")}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Approve, reject, and monitor customer reviews
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-amber-100 p-5">
            <p className="text-xs text-amber-700 uppercase font-semibold tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{counts.Pending || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-5">
            <p className="text-xs text-green-700 uppercase font-semibold tracking-wide">Approved</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{counts.Approved || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-5">
            <p className="text-xs text-red-700 uppercase font-semibold tracking-wide">Rejected</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{counts.Rejected || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading reviews...</div>
          ) : queue.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No reviews found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {queue.map((review) => (
                    <tr key={review.reviewId}>
                      <td className="px-4 py-3 align-top">
                        <p className="text-sm font-semibold text-gray-900">{review.productTitle}</p>
                        <p className="text-xs text-gray-500">{review.productCategory || "Category"}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-sm text-gray-900 font-medium">{review.reviewerName}</p>
                        <p className="text-xs text-gray-500 mb-2">Rating: {review.rating}/5</p>
                        <p className="text-sm text-gray-700">{review.comment || "No comment provided."}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="text-sm font-medium text-gray-900">{review.sentimentLabel}</p>
                        <p className="text-xs text-gray-500">Score: {review.sentimentScore}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${
                            badgeStyles[review.moderationStatus] || "bg-gray-50 text-gray-700 border-gray-100"
                          }`}
                        >
                          {review.moderationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleModeration(review, "Approved")}
                            disabled={savingReviewId === review.reviewId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleModeration(review, "Pending")}
                            disabled={savingReviewId === review.reviewId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-60"
                          >
                            <Clock3 className="w-3.5 h-3.5" />
                            Pending
                          </button>
                          <button
                            onClick={() => handleModeration(review, "Rejected")}
                            disabled={savingReviewId === review.reviewId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} reviews)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={pagination.page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, Number(pagination.totalPages || 1)))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsModeration;
