import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map();

const restoreScrollPosition = (top) => {
  let attempts = 0;

  const restore = () => {
    window.scrollTo(0, top);
    attempts += 1;

    if (attempts < 60 && Math.abs(window.scrollY - top) > 4) {
      window.requestAnimationFrame(restore);
    }
  };

  window.requestAnimationFrame(restore);
};

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return undefined;

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    if (navigationType === "POP") {
      restoreScrollPosition(scrollPositions.get(location.key) || 0);
    } else {
      window.scrollTo(0, 0);
    }

    return () => {
      scrollPositions.set(location.key, window.scrollY);
    };
  }, [location.key, navigationType]);

  return null;
}
