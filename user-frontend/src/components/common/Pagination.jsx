import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange, isDark = false }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const btnBase = `inline-flex items-center justify-center min-w-[36px] h-9 rounded-xl text-sm font-bold transition-all cursor-pointer`;
  const btnActive = isDark
    ? "bg-primary text-white shadow-md"
    : "bg-primary text-white shadow-md";
  const btnInactive = isDark
    ? "bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800 hover:text-slate-200"
    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:text-stone-900";
  const btnDisabled = `opacity-40 cursor-not-allowed`;

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${btnBase} ${currentPage <= 1 ? btnDisabled : btnInactive}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className={`min-w-[24px] text-center text-sm font-bold ${isDark ? "text-slate-600" : "text-stone-400"}`}>
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${p === currentPage ? btnActive : btnInactive}`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`${btnBase} ${currentPage >= totalPages ? btnDisabled : btnInactive}`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
