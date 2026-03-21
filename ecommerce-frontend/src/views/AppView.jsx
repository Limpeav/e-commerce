import { Suspense, lazy } from "react";
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
import { useAuth } from "../context/AuthContext";
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

const LazyComponents = {};
Object.keys(lazyComponents).forEach((key) => {
  LazyComponents[key] = lazy(lazyComponents[key]);
});

const phoneExemptPaths = [
  "/complete-profile",
  "/login",
  "/register",
  "/admin/login",
  "/forgot-password",
  "/reset-password",
];

export default function AppView() {
  const location = useLocation();
  const { user } = useAuth();
  const [isDark] = useDarkMode();

  const isAdminRoute =
    location.pathname.startsWith("/admin") &&
    location.pathname !== "/admin/login";
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

  const renderRouteElement = (Component, isProtected, isAdmin) => {
    if (isAdmin) {
      return (
        <AdminRoute>
          <div className="min-h-screen">
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

    return (
      <PageTransition>
        <Component />
      </PageTransition>
    );
  };

  const renderRoute = (route, isProtected = false, isAdmin = false) => {
    const Component = LazyComponents[route.component];

    return (
      <Route
        key={route.path}
        path={route.path}
        element={renderRouteElement(Component, isProtected, isAdmin)}
      />
    );
  };

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <div
        className={
          isDark
            ? "bg-slate-950 text-slate-100 transition-colors duration-300"
            : "bg-stone-50 text-text-main transition-colors duration-300"
        }
      >
        {shouldShowNavFooter && <Navbar />}

        <main
          className={`min-h-screen transition-colors duration-300 ${
            isDark ? "bg-slate-950" : "bg-stone-50"
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
