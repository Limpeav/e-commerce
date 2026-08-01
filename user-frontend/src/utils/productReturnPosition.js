export const SAVE_SCROLL_POSITION_EVENT = "scroll-position:save";
export const PRODUCT_RETURN_POSITION_STORAGE_KEY = "cherish-product-return-position-v1";

export const readProductReturnPosition = () => {
  if (typeof window === "undefined") return null;

  try {
    const storedPosition = window.sessionStorage.getItem(PRODUCT_RETURN_POSITION_STORAGE_KEY);
    return storedPosition ? JSON.parse(storedPosition) : null;
  } catch {
    return null;
  }
};

export const clearProductReturnPosition = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(PRODUCT_RETURN_POSITION_STORAGE_KEY);
  } catch {
    // Ignore storage failures; page-level fallback scrolling should still work.
  }
};

const isReloadNavigation = () => {
  if (typeof window === "undefined" || !window.performance?.getEntriesByType) {
    return false;
  }

  const navigationEntry = window.performance.getEntriesByType("navigation")?.[0];
  return navigationEntry?.type === "reload";
};

const getPageLoadStartTime = () => {
  if (typeof window === "undefined") return 0;

  return window.performance?.timeOrigin || 0;
};

export const hasStaleProductReturnPosition = () => {
  const returnPosition = readProductReturnPosition();

  if (!returnPosition?.productId || !isReloadNavigation()) {
    return false;
  }

  const createdAt = Number(returnPosition.createdAt);
  return !Number.isFinite(createdAt) || createdAt < getPageLoadStartTime();
};

export const saveProductReturnPosition = ({
  productId,
  productSectionId,
  productIndex,
  cardElement,
}) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(SAVE_SCROLL_POSITION_EVENT));

  const cardRect = cardElement?.getBoundingClientRect();
  const sectionId =
    productSectionId ||
    cardElement?.closest("section[id]")?.id ||
    null;
  const productScroller = cardElement?.closest("[data-product-scroller]");

  try {
    window.sessionStorage.setItem(
      PRODUCT_RETURN_POSITION_STORAGE_KEY,
      JSON.stringify({
        productId,
        sectionId,
        productIndex: Number.isInteger(productIndex) ? productIndex : null,
        scrollerId: productScroller?.dataset.productScroller || null,
        scrollerLeft: productScroller?.scrollLeft ?? null,
        scrollY: window.scrollY,
        cardTop: cardRect?.top ?? null,
        createdAt: Date.now(),
      })
    );
  } catch {
    // Ignore storage failures; global scroll restoration still handles normal browsers.
  }
};

const defaultGetTargetCard = (returnPosition) =>
  Array.from(document.querySelectorAll("[data-product-card]"))
    .find((card) => card.dataset.productId === String(returnPosition.productId));

export const restoreProductReturnPosition = ({
  getTargetCard = defaultGetTargetCard,
  onBeforeScroll,
  maxAttempts = 20,
  retryDelay = 100,
  maxCorrections = 6,
  correctionDelay = 60,
} = {}) => {
  if (typeof window === "undefined" || typeof document === "undefined") return undefined;

  const returnPosition = readProductReturnPosition();

  if (!returnPosition?.productId) return undefined;

  let attempt = 0;
  let correctionCount = 0;
  let restoreTimer = null;
  let frameId = null;
  let isCancelled = false;

  const finishRestore = ({ clearSavedPosition = true } = {}) => {
    if (restoreTimer) {
      window.clearTimeout(restoreTimer);
      restoreTimer = null;
    }
    if (frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
    if (clearSavedPosition) {
      clearProductReturnPosition();
    }
  };

  const cancelRestore = () => {
    isCancelled = true;
    finishRestore();
  };

  const restoreProductPosition = () => {
    if (isCancelled) return;

    const targetCard = getTargetCard(returnPosition);

    if (targetCard) {
      onBeforeScroll?.({ returnPosition, targetCard });

      const cardRect = targetCard.getBoundingClientRect();
      const cardTop = Number(returnPosition.cardTop);
      const fallbackTop = Number(returnPosition.scrollY);
      const nextTop = Number.isFinite(cardTop)
        ? window.scrollY + cardRect.top - cardTop
        : fallbackTop;

      if (Number.isFinite(nextTop)) {
        window.scrollTo({ top: Math.max(0, nextTop), left: 0, behavior: "auto" });
      }

      if (correctionCount < maxCorrections) {
        correctionCount += 1;
        restoreTimer = window.setTimeout(() => {
          frameId = window.requestAnimationFrame(restoreProductPosition);
        }, correctionDelay);
        return;
      }

      finishRestore();
      return;
    }

    if (attempt < maxAttempts) {
      attempt += 1;
      restoreTimer = window.setTimeout(() => {
        frameId = window.requestAnimationFrame(restoreProductPosition);
      }, retryDelay);
    }
  };

  window.addEventListener("wheel", cancelRestore, { passive: true });
  window.addEventListener("touchstart", cancelRestore, { passive: true });
  window.addEventListener("pointerdown", cancelRestore, { passive: true });
  window.addEventListener("keydown", cancelRestore);
  frameId = window.requestAnimationFrame(restoreProductPosition);

  return () => {
    finishRestore({ clearSavedPosition: false });
    window.removeEventListener("wheel", cancelRestore);
    window.removeEventListener("touchstart", cancelRestore);
    window.removeEventListener("pointerdown", cancelRestore);
    window.removeEventListener("keydown", cancelRestore);
  };
};
