import { useEffect, useRef, useState } from "react";
import {
  finishGlobalLoading,
  loadingIndicatorEvents,
  startGlobalLoading,
} from "../../services/loadingIndicator";

const SHOW_DELAY_MS = 120;
const MIN_VISIBLE_MS = 250;
const NAVIGATION_SETTLE_MS = 400;

/**
 * GlobalLoadingIndicator
 *
 * Shows a slim top progress bar (à la YouTube / GitHub) during API requests
 * and navigations without blocking interaction with the current page.
 */
const GlobalLoadingIndicator = () => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeRequestsRef = useRef(new Set());
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const completionTimerRef = useRef(null);
  const visibleSinceRef = useRef(0);

  const startProgressBar = () => {
    window.clearInterval(progressIntervalRef.current);
    window.clearTimeout(completionTimerRef.current);
    completionTimerRef.current = null;
    setProgress(0);
    // Quickly get to ~70%, then slow down to simulate real loading
    progressIntervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          window.clearInterval(progressIntervalRef.current);
          return prev;
        }
        // Fast at the start, slow as it approaches 85%
        const increment = prev < 30 ? 8 : prev < 60 ? 4 : 1.2;
        return Math.min(prev + increment, 85);
      });
    }, 80);
  };

  const finishProgressBar = (onComplete) => {
    window.clearInterval(progressIntervalRef.current);
    setProgress(100);
    completionTimerRef.current = window.setTimeout(() => {
      if (activeRequestsRef.current.size > 0) return;

      setVisible(false);
      setProgress(0);
      completionTimerRef.current = null;
      onComplete?.();
    }, 280);
  };

  useEffect(() => {
    const clearShowTimer = () => {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    };

    const hideWhenReady = () => {
      clearShowTimer();

      const visibleFor = performance.now() - visibleSinceRef.current;
      const remainingTime = visibleSinceRef.current
        ? Math.max(0, MIN_VISIBLE_MS - visibleFor)
        : 0;

      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        finishProgressBar(() => {
          visibleSinceRef.current = 0;
        });
      }, remainingTime);
    };

    const handleStart = (event) => {
      const id = event.detail?.id;
      if (!id) return;

      const wasIdle = activeRequestsRef.current.size === 0;
      activeRequestsRef.current.add(id);
      window.clearTimeout(hideTimerRef.current);
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;

      if (wasIdle && visibleSinceRef.current) {
        startProgressBar();
        return;
      }

      if (!visibleSinceRef.current && !showTimerRef.current) {
        showTimerRef.current = window.setTimeout(() => {
          if (activeRequestsRef.current.size > 0) {
            visibleSinceRef.current = performance.now();
            setVisible(true);
            startProgressBar();
          }
          showTimerRef.current = null;
        }, SHOW_DELAY_MS);
      }
    };

    const handleEnd = (event) => {
      activeRequestsRef.current.delete(event.detail?.id);

      if (activeRequestsRef.current.size === 0) {
        hideWhenReady();
      }
    };

    window.addEventListener(loadingIndicatorEvents.start, handleStart);
    window.addEventListener(loadingIndicatorEvents.end, handleEnd);

    return () => {
      clearShowTimer();
      window.clearTimeout(hideTimerRef.current);
      window.clearTimeout(completionTimerRef.current);
      window.clearInterval(progressIntervalRef.current);
      window.removeEventListener(loadingIndicatorEvents.start, handleStart);
      window.removeEventListener(loadingIndicatorEvents.end, handleEnd);
    };
  }, []);

  // Intercept browser history to show the bar during navigations
  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrapHistoryMethod = (originalMethod) =>
      function navigationWithFeedback(...args) {
        const loadingId = startGlobalLoading("navigation");
        const result = originalMethod.apply(this, args);

        window.setTimeout(
          () => finishGlobalLoading(loadingId),
          NAVIGATION_SETTLE_MS
        );

        return result;
      };

    const wrappedPushState = wrapHistoryMethod(originalPushState);
    const wrappedReplaceState = wrapHistoryMethod(originalReplaceState);

    window.history.pushState = wrappedPushState;
    window.history.replaceState = wrappedReplaceState;

    const handlePopState = () => {
      const loadingId = startGlobalLoading("navigation");
      window.setTimeout(
        () => finishGlobalLoading(loadingId),
        NAVIGATION_SETTLE_MS
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      if (window.history.pushState === wrappedPushState) {
        window.history.pushState = originalPushState;
      }
      if (window.history.replaceState === wrappedReplaceState) {
        window.history.replaceState = originalReplaceState;
      }
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute("aria-busy", visible ? "true" : "false");
    return () => document.body.removeAttribute("aria-busy");
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* Slim top progress bar — always visible */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] overflow-hidden"
        role="progressbar"
        aria-label="Loading"
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full bg-primary shadow-[0_0_10px_0px_var(--color-primary)] transition-all"
          style={{
            width: `${progress}%`,
            transitionDuration: progress === 100 ? "200ms" : "80ms",
            transitionTimingFunction: "ease-out",
          }}
        />
      </div>

    </>
  );
};

export default GlobalLoadingIndicator;
