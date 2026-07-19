import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map();
const HOME_PATHS = new Set(["/", "/customer"]);
const SAVE_SCROLL_POSITION_EVENT = "scroll-position:save";

const getScrollPositionKey = (location) => {
  if (HOME_PATHS.has(location.pathname)) {
    return "home";
  }

  return `${location.pathname}${location.search}`;
};

const restoreScrollPosition = (top, onComplete) => {
  let frameId = null;
  let timeoutId = null;
  let observer = null;

  const restore = () => {
    frameId = null;
    window.scrollTo({ top, left: 0, behavior: "auto" });

    if (Math.abs(window.scrollY - top) <= 4) {
      observer?.disconnect();
      window.clearTimeout(timeoutId);
      onComplete();
    }
  };

  const scheduleRestore = () => {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(restore);
    }
  };

  observer = new ResizeObserver(scheduleRestore);
  observer.observe(document.body);
  scheduleRestore();

  timeoutId = window.setTimeout(() => {
    observer.disconnect();
    onComplete();
  }, 5000);

  return () => {
    observer.disconnect();
    window.clearTimeout(timeoutId);
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
    }
  };
};

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const hasHash = Boolean(location.hash);
  const shouldForceTop = location.state?.scrollToTop === true;
  const scrollPositionKey = getScrollPositionKey(location);

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const savedPosition = scrollPositions.get(scrollPositionKey);
    const shouldRestore = savedPosition !== null
      && savedPosition !== undefined
      && !hasHash
      && !shouldForceTop
      && navigationType === "POP";
    let isRestoring = shouldRestore;
    let cancelRestore = null;

    const saveScrollPosition = () => {
      if (isRestoring) return;

      scrollPositions.set(scrollPositionKey, window.scrollY);
    };

    if (shouldRestore) {
      cancelRestore = restoreScrollPosition(savedPosition, () => {
        isRestoring = false;
      });
    } else if (!hasHash || shouldForceTop) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    window.addEventListener("pagehide", saveScrollPosition);
    window.addEventListener(SAVE_SCROLL_POSITION_EVENT, saveScrollPosition);

    return () => {
      saveScrollPosition();
      cancelRestore?.();
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("pagehide", saveScrollPosition);
      window.removeEventListener(SAVE_SCROLL_POSITION_EVENT, saveScrollPosition);
    };
  }, [hasHash, navigationType, scrollPositionKey, shouldForceTop]);

  return null;
}
