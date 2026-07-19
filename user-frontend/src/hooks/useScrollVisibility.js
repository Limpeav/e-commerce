import { useCallback, useEffect, useRef, useState } from "react";

export function useScrollVisibility({
  delta = 6,
  topThreshold = 48,
  keepVisibleFocusSelector = "",
} = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const frameRef = useRef(null);
  const shouldKeepVisible = useCallback(() => {
    if (!keepVisibleFocusSelector) return false;

    return Boolean(document.activeElement?.matches?.(keepVisibleFocusSelector));
  }, [keepVisibleFocusSelector]);

  useEffect(() => {
    lastScrollYRef.current = Math.max(window.scrollY, 0);

    const handleScroll = () => {
      if (frameRef.current) return;

      frameRef.current = window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(window.scrollY, 0);
        const scrollDelta = currentScrollY - lastScrollYRef.current;
        const isNearTop = currentScrollY < topThreshold;
        const hasMeaningfulScroll = Math.abs(scrollDelta) > delta;

        if (isNearTop || shouldKeepVisible()) {
          setIsVisible(true);
        } else if (hasMeaningfulScroll) {
          setIsVisible(scrollDelta < 0);
        }

        lastScrollYRef.current = currentScrollY;
        frameRef.current = null;
      });
    };

    const handleFocusChange = () => {
      if (shouldKeepVisible()) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [delta, shouldKeepVisible, topThreshold]);

  return isVisible;
}
