import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { adminLazyComponents, adminRoutes } from "@shared/config/routes";
import AdminSidebar from "@shared/components/admin/AdminSidebar";
import ErrorBoundary from "@shared/components/common/ErrorBoundary";
import Loading from "@shared/components/common/Loading";
import PageTransition from "@shared/components/common/PageTransition";
import ScrollToTop from "@shared/components/common/ScrollToTop";
import AdminRoute from "@shared/views/auth/AdminRoute";
import { buildPortalUrl, portalConfig } from "@shared/utils/portalConfig";

const LazyComponents = {};
Object.keys(adminLazyComponents).forEach((key) => {
  LazyComponents[key] = lazy(adminLazyComponents[key]);
});

const publicPortalRoutes = [
  { path: "/admin/login", component: "AdminLogin" },
  { path: "/seller", component: "StaffLogin" },
  { path: "/seller/login", component: "StaffLogin" },
  { path: "/delivery", component: "StaffLogin" },
  { path: "/delivery/login", component: "StaffLogin" },
];

const publicPortalPaths = new Set(publicPortalRoutes.map((route) => route.path));

const isPortalPath = (pathname) =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/seller") ||
  pathname.startsWith("/delivery");

const getPortalTitle = (pathname) => {
  if (pathname.startsWith("/seller")) {
    return "Seller Portal";
  }

  if (pathname.startsWith("/delivery")) {
    return "Delivery Portal";
  }

  return "Admin Portal";
};

export default function AdminApp() {
  const location = useLocation();
  const isPublicRoute = publicPortalPaths.has(location.pathname);
  const isDeliveryRoute = location.pathname.startsWith("/delivery");
  const showSidebar = !isPublicRoute && !isDeliveryRoute;

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.lang = "en";
    document.documentElement.dataset.language = "en";
  }, []);

  useEffect(() => {
    document.title = getPortalTitle(location.pathname);
  }, [location.pathname]);

  if (location.pathname === "/") {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isPortalPath(location.pathname)) {
    window.location.assign(buildPortalUrl(portalConfig.customerUrl, location));
    return <Loading fullScreen />;
  }

  const renderRouteElement = (route, isAdmin = false) => {
    const Component = LazyComponents[route.component];

    if (!isAdmin) {
      return (
        <PageTransition>
          <Component />
        </PageTransition>
      );
    }

    return (
      <AdminRoute allowedRoles={route.allowedRoles}>
        <PageTransition>
          <Component />
        </PageTransition>
      </AdminRoute>
    );
  };

  const renderRoute = (route, isAdmin = false) => (
    <Route
      key={route.path}
      path={route.path}
      element={renderRouteElement(route, isAdmin)}
    />
  );

  return (
    <ErrorBoundary>
      <ScrollToTop />
      <main className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)]">
        {showSidebar && <AdminSidebar />}
        <div className={showSidebar ? "lg:ml-64" : ""}>
          <Suspense fallback={<Loading fullScreen={isPublicRoute} />}>
            <Routes>
              {publicPortalRoutes.map((route) => renderRoute(route))}
              {adminRoutes.map((route) => renderRoute(route, true))}
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </ErrorBoundary>
  );
}
