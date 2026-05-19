const PRODUCT_BACK_SCROLL_KEY = "productBackScrollTop";

export const requestProductBackScrollTop = () => {
  window.sessionStorage.setItem(PRODUCT_BACK_SCROLL_KEY, "true");
};

export const consumeProductBackScrollTop = () => {
  const shouldScroll = window.sessionStorage.getItem(PRODUCT_BACK_SCROLL_KEY) === "true";

  if (shouldScroll) {
    window.sessionStorage.removeItem(PRODUCT_BACK_SCROLL_KEY);
  }

  return shouldScroll;
};
