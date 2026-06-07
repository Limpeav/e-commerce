import { useEffect, useRef, useState } from "react";
import { Loader } from "../Loader";
import { useLanguage } from "../../context/useLanguage";
import {
  finishGlobalLoading,
  loadingIndicatorEvents,
  startGlobalLoading,
} from "../../services/loadingIndicator";

const SHOW_DELAY_MS = 250;
const MIN_VISIBLE_MS = 300;
const NAVIGATION_SETTLE_MS = 650;

const GlobalLoadingIndicator = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const activeRequestsRef = useRef(new Set());
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const visibleSinceRef = useRef(0);

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
        setVisible(false);
        visibleSinceRef.current = 0;
      }, remainingTime);
    };

    const handleStart = (event) => {
      const id = event.detail?.id;
      if (!id) return;

      activeRequestsRef.current.add(id);
      window.clearTimeout(hideTimerRef.current);

      if (!visibleSinceRef.current && !showTimerRef.current) {
        showTimerRef.current = window.setTimeout(() => {
          if (activeRequestsRef.current.size > 0) {
            visibleSinceRef.current = performance.now();
            setVisible(true);
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
      window.removeEventListener(loadingIndicatorEvents.start, handleStart);
      window.removeEventListener(loadingIndicatorEvents.end, handleEnd);
    };
  }, []);

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
    <Loader
      message={t("loading.pleaseWait")}
      fullScreen
      size="large"
      className="!z-[1000]"
    />
  );
};

export default GlobalLoadingIndicator;
