import { useEffect, useMemo, useState } from "react";

const getGridColumnCount = () => {
  if (typeof window === "undefined") return 4;
  if (window.matchMedia("(min-width: 1280px)").matches) return 4;
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  return 2;
};

export const useVisibleProductRows = ({
  totalProducts = 0,
  initialRows = 4,
  rowsPerStep = 4,
  resetKey = "",
} = {}) => {
  const [columns, setColumns] = useState(getGridColumnCount);
  const [rowState, setRowState] = useState({
    resetKey,
    visibleRows: initialRows,
  });
  const visibleRows = rowState.resetKey === resetKey ? rowState.visibleRows : initialRows;

  useEffect(() => {
    const updateColumns = () => {
      setColumns(getGridColumnCount());
    };

    window.addEventListener("resize", updateColumns);

    return () => {
      window.removeEventListener("resize", updateColumns);
    };
  }, []);

  const visibleCount = useMemo(
    () => Math.min(totalProducts, visibleRows * columns),
    [columns, totalProducts, visibleRows]
  );

  const hasMoreProducts = visibleCount < totalProducts;
  const showMoreProducts = () => {
    setRowState({
      resetKey,
      visibleRows: visibleRows + rowsPerStep,
    });
  };

  return {
    visibleCount,
    hasMoreProducts,
    showMoreProducts,
  };
};
