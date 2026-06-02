import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  additionalRoutes,
  hideNavFooterPaths,
  protectedRoutes,
  publicRoutes,
  userLazyComponents,
} from "../config/routes";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";
import { useDarkMode } from "../hooks";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ProtectedRoute from "./auth/ProtectedRoute";
import ScrollToTop from "../components/common/ScrollToTop";
import Loading from "../components/common/Loading";
import ErrorBoundary from "../components/common/ErrorBoundary";
import PageTransition from "../components/common/PageTransition";
import StaticTextTranslator from "../components/common/StaticTextTranslator";
import {
  buildPortalUrl,
  isAdminPortal,
  isCustomerPortal,
  isPortalPath,
  portalConfig,
} from "../utils/portalConfig";

const LazyComponents = {};
Object.keys(userLazyComponents).forEach((key) => {
  LazyComponents[key] = lazy(userLazyComponents[key]);
});

const phoneExemptPaths = [
  "/complete-profile",
  "/login",
  "/register",
  "/admin/login",
  "/customer",
  "/seller",
  "/seller/login",
  "/delivery",
  "/delivery/login",
  "/forgot-password",
  "/reset-password",
];

export default function AppView() {
  const location = useLocation();
  const { user } = useAuth();
  const [isDark] = useDarkMode();
  const { language } = useLanguage();
  const authenticatedRedirect = user?.phone ? "/customer" : "/complete-profile";
  const isPortalRoute = isPortalPath(location.pathname);

  useEffect(() => {
    if (isCustomerPortal() && isPortalRoute) {
      window.location.assign(buildPortalUrl(portalConfig.adminUrl, location));
      return;
    }

    if (isAdminPortal() && !isPortalRoute) {
      const isAdminRoot = location.pathname === "/";
      const redirectUrl = isAdminRoot
        ? `${portalConfig.adminUrl || ""}/admin/login`
        : buildPortalUrl(portalConfig.customerUrl, location);

      window.location.assign(redirectUrl);
    }
  }, [isPortalRoute, location]);

  useEffect(() => {
    // Clear any leftover global page-lock styles from modals when routes change.
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.top = "";
    document.body.style.pointerEvents = "";
  }, [location.pathname]);

  useEffect(() => {
    const html = document.documentElement;

    if (isPortalRoute) {
      html.classList.add("dark");
      html.lang = "en";
      html.dataset.language = "en";
      return;
    }

    html.classList.toggle("dark", isDark);
    html.lang = language;
    html.dataset.language = language;
  }, [isPortalRoute, isDark, language]);

  const isAdminRoute =
    (location.pathname.startsWith("/admin") &&
      location.pathname !== "/admin/login") ||
    location.pathname.startsWith("/seller/dashboard") ||
    location.pathname.startsWith("/seller/payment-queue") ||
    location.pathname.startsWith("/seller/orders") ||
    location.pathname.startsWith("/seller/cash-report") ||
    location.pathname.startsWith("/delivery/orders");
  const isOrderReviewRoute = /^\/(?:customer\/)?orders\/[^/]+\/review\/?$/.test(
    location.pathname
  );
  const shouldShowNavFooter =
    !hideNavFooterPaths.includes(location.pathname) && !isAdminRoute && !isOrderReviewRoute;

  const needsPhone =
    user &&
    !user.phone &&
    !phoneExemptPaths.includes(location.pathname) &&
    !isAdminRoute;

  if (needsPhone) {
    return <Navigate to="/complete-profile" replace />;
  }

  const renderRouteElement = (route, isProtected) => {
    const Component = LazyComponents[route.component];
    const isUserAuthPage =
      route.path === "/login" ||
      route.path === "/register" ||
      route.path === "/forgot-password" ||
      route.path === "/reset-password";

    if (isProtected) {
      return (
        <ProtectedRoute>
          <PageTransition>
            <Component />
          </PageTransition>
        </ProtectedRoute>
      );
    }

    if (isUserAuthPage && user) {
      return <Navigate to={authenticatedRedirect} replace />;
    }

    return (
      <PageTransition>
        <Component />
      </PageTransition>
    );
  };

  const renderRoute = (route, isProtected = false) => {
    return (
      <Route
        key={route.path}
        path={route.path}
        element={renderRouteElement(route, isProtected)}
      />
    );
  };

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <div
        className={
          isPortalRoute || isDark
            ? "bg-slate-950 text-slate-100 transition-colors duration-300"
            : "bg-stone-50 text-text-main transition-colors duration-300"
        }
      >
        {shouldShowNavFooter && <Navbar />}
        <StaticTextTranslator disabled={isPortalRoute} />

        <main
          className={`min-h-screen transition-colors duration-300 ${
            isPortalRoute || isDark ? "bg-slate-950" : "bg-stone-50"
          }`}
        >
          <Suspense fallback={<Loading />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {publicRoutes.map((route) => renderRoute(route))}
                {protectedRoutes.map((route) => renderRoute(route, true, false))}
                {additionalRoutes.map((route) => renderRoute(route))}
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>

        {shouldShowNavFooter && <Footer />}
      </div>
    </ErrorBoundary>
  );
}
