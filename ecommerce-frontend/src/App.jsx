import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import React from "react";
import { lazyComponents, publicRoutes, protectedRoutes, adminRoutes, additionalRoutes, hideNavFooterPaths } from "./config/routes";

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

// Create lazy loaded components
const LazyComponents = {};
Object.keys(lazyComponents).forEach(key => {
  LazyComponents[key] = lazy(lazyComponents[key]);
});

function App() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin") && location.pathname !== "/admin/login";
  const shouldShowNavFooter = !hideNavFooterPaths.includes(location.pathname) && !isAdminRoute;

  const renderRoute = (route, isProtected = false, isAdmin = false) => {
    const Component = LazyComponents[route.component];
    const Wrapper = isAdmin ? AdminRoute : isProtected ? ProtectedRoute : React.Fragment;
    
    return (
      <Route
        key={route.path}
        path={route.path}
        element={
          <Wrapper>
            <Component />
          </Wrapper>
        }
      />
    );
  };

  return (
    <ErrorBoundary>
      <ScrollToTop />

      {/* User Layout */}
      {shouldShowNavFooter && <Navbar />}

      {/* Admin Layout */}
      {isAdminRoute && <AdminSidebar />}

      <main className={`min-h-screen ${isAdminRoute ? 'lg:ml-64' : ''}`}>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map(route => renderRoute(route))}
            
            {/* Protected User Routes */}
            {protectedRoutes.map(route => renderRoute(route, true, false))}
            
            {/* Admin Routes */}
            {adminRoutes.map(route => renderRoute(route, false, true))}
            
            {/* Additional Routes */}
            {additionalRoutes.map(route => renderRoute(route))}
          </Routes>
        </Suspense>
      </main>

      {/* User Footer */}
      {shouldShowNavFooter && <Footer />}
    </ErrorBoundary>
  );
}

export default App;
