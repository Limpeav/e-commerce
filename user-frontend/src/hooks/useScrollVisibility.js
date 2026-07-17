import { useEffect, useRef, useState } from "react";

export function useScrollVisibility({ delta = 6, topThreshold = 48 } = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    lastScrollYRef.current = Math.max(window.scrollY, 0);

    const handleScroll = () => {
      if (frameRef.current) return;

      frameRef.current = window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(window.scrollY, 0);
        const scrollDelta = currentScrollY - lastScrollYRef.current;
        const isNearTop = currentScrollY < topThreshold;
        const hasMeaningfulScroll = Math.abs(scrollDelta) > delta;

        if (isNearTop) {
          setIsVisible(true);
        } else if (hasMeaningfulScroll) {
          setIsVisible(scrollDelta < 0);
        }

        lastScrollYRef.current = currentScrollY;
        frameRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [delta, topThreshold]);

  return isVisible;
}
