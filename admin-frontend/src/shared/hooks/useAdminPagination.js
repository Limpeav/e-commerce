import { useMemo, useState } from "react";

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const useAdminPagination = ({
  items = [],
  initialPageSize = 25,
  pageSizeOptions = ADMIN_PAGE_SIZE_OPTIONS,
  resetKey = "",
} = {}) => {
  const [paginationState, setPaginationState] = useState({
    page: 1,
    pageSize: initialPageSize,
    resetKey,
  });
  const pageSize = paginationState.pageSize;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const requestedPage =
    paginationState.resetKey === resetKey ? paginationState.page : 1;
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = totalItems ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [endIndex, items, startIndex]
  );

  const setPage = (nextPage) => {
    const numericPage = Number(nextPage);
    const normalizedPage = Number.isFinite(numericPage)
      ? Math.min(totalPages, Math.max(1, numericPage))
      : 1;

    setPaginationState((current) => ({
      ...current,
      page: normalizedPage,
      resetKey,
    }));
  };

  const setPageSize = (nextPageSize) => {
    const numericPageSize = Number(nextPageSize);
    const normalizedPageSize = pageSizeOptions.includes(numericPageSize)
      ? numericPageSize
      : initialPageSize;

    setPaginationState((current) => ({
      ...current,
      page: 1,
      pageSize: normalizedPageSize,
      resetKey,
    }));
  };

  return {
    currentPage,
    endIndex,
    pageSize,
    paginatedItems,
    setPage,
    setPageSize,
    startIndex,
    totalItems,
    totalPages,
  };
};
