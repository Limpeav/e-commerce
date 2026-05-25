import { Suspense, lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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

const isPortalPath = (pathname) =>
  pathname.startsWith("/admin") ||
  pathname.startsWith("/seller") ||
  pathname.startsWith("/delivery");

export default function AdminApp() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.lang = "en";
    document.documentElement.dataset.language = "en";
  }, []);

  if (location.pathname === "/") {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isPortalPath(location.pathname)) {
    window.location.assign(buildPortalUrl(portalConfig.customerUrl, location));
    return <Loading />;
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

    const isDeliveryRoute = route.path.startsWith("/delivery");

    return (
      <AdminRoute allowedRoles={route.allowedRoles}>
        <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-main)]">
          {!isDeliveryRoute && <AdminSidebar />}
          <div className={isDeliveryRoute ? "" : "lg:ml-64"}>
            <PageTransition>
              <Component />
            </PageTransition>
          </div>
        </div>
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
        <Suspense fallback={<Loading />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {publicPortalRoutes.map((route) => renderRoute(route))}
              {adminRoutes.map((route) => renderRoute(route, true))}
              <Route path="*" element={<Navigate to="/admin/login" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
    </ErrorBoundary>
  );
}
