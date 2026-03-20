import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import React from "react";
import { AnimatePresence } from "framer-motion";
import { lazyComponents, publicRoutes, protectedRoutes, adminRoutes, additionalRoutes, hideNavFooterPaths } from "./config/routes";
import { useAuth } from "./context/AuthContext";

// Layout components
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AdminSidebar from "./components/admin/AdminSidebar";

// Route protection
import ProtectedRoute from "./views/auth/ProtectedRoute";
import AdminRoute from "./views/auth/AdminRoute";

// Utility components
import ScrollToTop from "./components/common/ScrollToTop";
import Loading from "./components/common/Loading";
import ErrorBoundary from "./components/common/ErrorBoundary";
import PageTransition from "./components/common/PageTransition";
import { useDarkMode } from "./hooks";

// Create lazy loaded components
const LazyComponents = {};
Object.keys(lazyComponents).forEach(key => {
  LazyComponents[key] = lazy(lazyComponents[key]);
});

// Paths that should be accessible without phone number
const phoneExemptPaths = [
  "/complete-profile",
  "/login",
  "/register",
  "/admin/login",
  "/forgot-password",
  "/reset-password",
];

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const [isDark] = useDarkMode();

  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";
  const shouldShowNavFooter = !hideNavFooterPaths.includes(location.pathname) && !isAdminRoute;

  // Redirect Google users without phone to complete-profile
  const needsPhone = user && !user.phone && !phoneExemptPaths.includes(location.pathname) && !isAdminRoute;
  if (needsPhone) {
    return <Navigate to="/complete-profile" replace />;
  }

  const renderRoute = (route, isProtected = false, isAdmin = false) => {
    const Component = LazyComponents[route.component];
    const Wrapper = isAdmin ? AdminRoute : isProtected ? ProtectedRoute : React.Fragment;

    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <Wrapper>
            <PageTransition>
              <Component />
            </PageTransition>
          </Wrapper>
        }
      />
    );
  };

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <div className={isDark ? "bg-slate-950 text-slate-100 transition-colors duration-300" : "bg-stone-50 text-text-main transition-colors duration-300"}>
        {/* User Layout */}
        {shouldShowNavFooter && <Navbar />}

        {/* Admin Layout */}
        {isAdminRoute && <AdminSidebar />}

        <main className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-stone-50"} ${isAdminRoute ? 'lg:ml-64' : ''}`}>
          <Suspense fallback={<Loading />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                {/* Public Routes */}
                {publicRoutes.map(route => renderRoute(route))}

                {/* Protected User Routes */}
                {protectedRoutes.map(route => renderRoute(route, true, false))}

                {/* Admin Routes */}
                {adminRoutes.map(route => renderRoute(route, false, true))}

                {/* Additional Routes */}
                {additionalRoutes.map(route => renderRoute(route))}
              </Routes>
            </AnimatePresence>
          </Suspense>
        </main>

        {/* User Footer */}
        {shouldShowNavFooter && <Footer />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
