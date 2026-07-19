import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { DashboardController } from "../../../controllers";
import Loading from "../../../components/common/Loading";
import {
  getStoredAdminToken,
  getStoredAdminUser,
} from "../../../utils/adminSession";
import { subscribeRealtimeDomains } from "../../../services/realtime";
import {
  completeDashboardScrollRestore,
  getDashboardScrollKey,
  readDashboardScrollPosition,
  saveDashboardScrollPosition,
} from "../../../utils/dashboardScroll";
import DashboardPage from "./DashboardPage";

let dashboardCache = null;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const adminUser = getStoredAdminUser();
  const adminToken = getStoredAdminToken();
  const cachedDashboard =
    dashboardCache?.token === adminToken ? dashboardCache : null;
  const dashboardScrollKey = getDashboardScrollKey(adminUser);
  const restoredScrollRef = useRef(false);
  const hasCachedDashboardRef = useRef(Boolean(cachedDashboard));
  const [period, setPeriod] = useState(() => cachedDashboard?.period || "30");
  const periodRef = useRef(period);
  const [stats, setStats] = useState(() => cachedDashboard?.stats || null);
  const [orders, setOrders] = useState(() => cachedDashboard?.orders || []);
  const [products, setProducts] = useState(
    () => cachedDashboard?.products || []
  );
  const [loading, setLoading] = useState(() => !cachedDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const navigateFromDashboard = useCallback(
    (to, options) => {
      saveDashboardScrollPosition(
        sessionStorage,
        dashboardScrollKey,
        window.scrollY,
        { markForRestore: true }
      );
      navigate(to, options);
    },
    [dashboardScrollKey, navigate]
  );

  const loadDashboard = useCallback(
    async ({ refresh = false, silent = false } = {}) => {
      if (refresh) setRefreshing(true);
      if (!refresh && !silent) setLoading(true);
      setError("");

      try {
        const [statsResponse, ordersResponse, productsResponse] =
          await Promise.all([
            DashboardController.getStats(),
            DashboardController.getOrders(),
            DashboardController.getProducts(),
          ]);
        const nextStats = statsResponse.data;
        const nextOrders = Array.isArray(ordersResponse.data)
          ? ordersResponse.data
          : [];
        const nextProducts = Array.isArray(productsResponse.data)
          ? productsResponse.data
          : [];

        dashboardCache = {
          token: adminToken,
          period: periodRef.current,
          stats: nextStats,
          orders: nextOrders,
          products: nextProducts,
        };
        setStats(nextStats);
        setOrders(nextOrders);
        setProducts(nextProducts);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adminToken]
  );

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => {
      loadDashboard({ silent: hasCachedDashboardRef.current });
    }, 0);
    const unsubscribe = subscribeRealtimeDomains(
      ["orders", "products", "reviews", "users"],
      () => loadDashboard({ silent: true })
    );

    return () => {
      window.clearTimeout(initialLoadId);
      unsubscribe();
    };
  }, [loadDashboard]);

  useEffect(() => {
    periodRef.current = period;
    if (dashboardCache) {
      dashboardCache.period = period;
    }
  }, [period]);

  useEffect(() => {
    if (loading || restoredScrollRef.current) return;

    const savedPosition = readDashboardScrollPosition(
      sessionStorage,
      dashboardScrollKey
    );
    let firstFrameId;
    let secondFrameId;
    let saveFrameId;

    const saveScrollPosition = () => {
      window.cancelAnimationFrame(saveFrameId);
      saveFrameId = window.requestAnimationFrame(() => {
        saveDashboardScrollPosition(
          sessionStorage,
          dashboardScrollKey,
          window.scrollY
        );
      });
    };

    const startTrackingScroll = () => {
      restoredScrollRef.current = true;
      completeDashboardScrollRestore(sessionStorage);
      window.addEventListener("scroll", saveScrollPosition, { passive: true });
    };

    if (savedPosition > 0) {
      firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(() => {
          window.scrollTo({ top: savedPosition, behavior: "auto" });
          startTrackingScroll();
        });
      });
    } else {
      startTrackingScroll();
    }

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
      window.cancelAnimationFrame(saveFrameId);
      window.removeEventListener("scroll", saveScrollPosition);
    };
  }, [dashboardScrollKey, loading]);

  if (loading) return <Loading message="Preparing business insights..." />;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-base)] p-6">
        <div className="max-w-md rounded-2xl border border-[#efc7bb] bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-9 w-9 text-[#b56f5c]" />
          <h1 className="mt-4 text-2xl font-bold">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{error}</p>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-6 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-bold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardPage
      adminUser={adminUser}
      stats={stats}
      orders={orders}
      products={products}
      period={period}
      setPeriod={setPeriod}
      refreshing={refreshing}
      loadDashboard={loadDashboard}
      navigateFromDashboard={navigateFromDashboard}
    />
  );
};

export default AdminDashboard;
