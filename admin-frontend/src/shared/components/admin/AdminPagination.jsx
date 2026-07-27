import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ADMIN_PAGE_SIZE_OPTIONS } from "../../hooks/useAdminPagination";

const AdminPagination = ({
  currentPage,
  endIndex,
  itemLabel = "items",
  pageSize,
  pageSizeOptions = ADMIN_PAGE_SIZE_OPTIONS,
  setPage,
  setPageSize,
  startIndex,
  totalItems,
  totalPages,
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-semibold text-gray-600">
        Showing{" "}
        <span className="font-black text-gray-950">{startIndex + 1}</span>
        {" - "}
        <span className="font-black text-gray-950">{endIndex}</span>
        {" of "}
        <span className="font-black text-gray-950">{totalItems}</span>
        {" "}
        {itemLabel}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
          Per page
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
            aria-label={`${itemLabel} per page`}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={currentPage === 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <label className="flex items-center gap-2 text-sm font-bold text-gray-600">
            Page
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(event) => {
                const requestedPage = Number(event.target.value);
                if (!Number.isFinite(requestedPage)) return;
                setPage(Math.min(totalPages, Math.max(1, requestedPage)));
              }}
              className="h-10 w-16 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm font-black text-gray-900 focus:border-[var(--color-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10"
              aria-label="Page number"
            />
            <span>of {totalPages}</span>
          </label>

          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={currentPage === totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPagination;
