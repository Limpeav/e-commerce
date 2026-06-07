import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map();
const HOME_PATHS = new Set(["/", "/customer"]);
let homeScrollPosition = null;

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
  const isHome = HOME_PATHS.has(location.pathname);

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const savedPosition = isHome
      ? homeScrollPosition
      : scrollPositions.get(location.key);
    const shouldRestore = savedPosition !== null
      && savedPosition !== undefined
      && (isHome || navigationType === "POP");
    let isRestoring = shouldRestore;
    let cancelRestore = null;

    if (shouldRestore) {
      cancelRestore = restoreScrollPosition(savedPosition, () => {
        isRestoring = false;
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    const saveScrollPosition = () => {
      if (isRestoring) return;

      scrollPositions.set(location.key, window.scrollY);
      if (isHome) {
        homeScrollPosition = window.scrollY;
      }
    };

    window.addEventListener("scroll", saveScrollPosition, { passive: true });

    return () => {
      cancelRestore?.();
      window.removeEventListener("scroll", saveScrollPosition);
      scrollPositions.set(location.key, window.scrollY);
      if (isHome) {
        homeScrollPosition = window.scrollY;
      }
    };
  }, [isHome, location.key, navigationType]);

  return null;
}
