import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import {
  additionalRoutes,
  adminRoutes,
  hideNavFooterPaths,
  lazyComponents,
  protectedRoutes,
  publicRoutes,
} from "../config/routes";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/useLanguage";
import { useDarkMode } from "../hooks";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import AdminSidebar from "../components/admin/AdminSidebar";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";
import ScrollToTop from "../components/common/ScrollToTop";
import Loading from "../components/common/Loading";
import ErrorBoundary from "../components/common/ErrorBoundary";
import PageTransition from "../components/common/PageTransition";
import StaticTextTranslator from "../components/common/StaticTextTranslator";

const LazyComponents = {};
Object.keys(lazyComponents).forEach((key) => {
  LazyComponents[key] = lazy(lazyComponents[key]);
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
  const isPortalRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/seller") ||
    location.pathname.startsWith("/delivery");

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
  const shouldShowNavFooter =
    !hideNavFooterPaths.includes(location.pathname) && !isAdminRoute;

  const needsPhone =
    user &&
    !user.phone &&
    !phoneExemptPaths.includes(location.pathname) &&
    !isAdminRoute;

  if (needsPhone) {
    return <Navigate to="/complete-profile" replace />;
  }

  const renderRouteElement = (route, isProtected, isAdmin) => {
    const Component = LazyComponents[route.component];
    const isUserAuthPage =
      route.path === "/login" ||
      route.path === "/register" ||
      route.path === "/forgot-password" ||
      route.path === "/reset-password";

    if (isAdmin) {
      const isDeliveryRoute = route.path.startsWith("/delivery");

      if (isDeliveryRoute) {
        return (
          <AdminRoute allowedRoles={route.allowedRoles}>
            <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)]">
              <PageTransition>
                <Component />
              </PageTransition>
            </div>
          </AdminRoute>
        );
      }

      return (
        <AdminRoute allowedRoles={route.allowedRoles}>
          <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)]">
            <AdminSidebar />
            <div className="lg:ml-64">
              <PageTransition>
                <Component />
              </PageTransition>
            </div>
          </div>
        </AdminRoute>
      );
    }

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

  const renderRoute = (route, isProtected = false, isAdmin = false) => {
    return (
      <Route
        key={route.path}
        path={route.path}
        element={renderRouteElement(route, isProtected, isAdmin)}
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
                {adminRoutes.map((route) => renderRoute(route, false, true))}
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
