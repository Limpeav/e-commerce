import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { shouldRestoreDashboardScroll } from "../../utils/dashboardScroll";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (shouldRestoreDashboardScroll(pathname, sessionStorage)) return;

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
