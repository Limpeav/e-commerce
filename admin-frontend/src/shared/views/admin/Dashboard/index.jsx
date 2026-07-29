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
import {
  DASHBOARD_PERIODS,
  formatDateInputValue,
  getDefaultDashboardDateRange,
  parseDateInputValue,
} from "./dashboardFormatters";
import DashboardPage from "./DashboardPage";

let dashboardCache = null;
const DEFAULT_DASHBOARD_PERIOD = "30";

const getDashboardFilterStorageKey = (adminUser) =>
  `adminDashboardFilter:${adminUser?._id || adminUser?.email || "admin"}`;

const isValidDashboardPeriod = (period) =>
  DASHBOARD_PERIODS.some((item) => item.value === period);

const normalizeStoredDateRange = (dateRange) => {
  const startDate = parseDateInputValue(dateRange?.startDate);
  const endDate = parseDateInputValue(dateRange?.endDate);

  if (!startDate || !endDate) return getDefaultDashboardDateRange();

  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(endDate),
  };
};

const readStoredDashboardFilter = (storageKey) => {
  try {
    const rawFilter = window.localStorage.getItem(storageKey);
    if (!rawFilter) return null;

    const filter = JSON.parse(rawFilter);

    return {
      period: isValidDashboardPeriod(filter?.period)
        ? filter.period
        : DEFAULT_DASHBOARD_PERIOD,
      dateRange: normalizeStoredDateRange(filter?.dateRange),
    };
  } catch {
    return null;
  }
};

const saveStoredDashboardFilter = (storageKey, filter) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(filter));
  } catch {
    // Dashboard filter persistence is a convenience; ignore storage failures.
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const adminUser = getStoredAdminUser();
  const adminToken = getStoredAdminToken();
  const cachedDashboard =
    dashboardCache?.token === adminToken ? dashboardCache : null;
  const dashboardScrollKey = getDashboardScrollKey(adminUser);
  const dashboardFilterStorageKey = getDashboardFilterStorageKey(adminUser);
  const storedDashboardFilter = readStoredDashboardFilter(dashboardFilterStorageKey);
  const restoredScrollRef = useRef(false);
  const hasCachedDashboardRef = useRef(Boolean(cachedDashboard));
  const [period, setPeriod] = useState(
    () =>
      cachedDashboard?.period ||
      storedDashboardFilter?.period ||
      DEFAULT_DASHBOARD_PERIOD
  );
  const [dateRange, setDateRange] = useState(
    () =>
      cachedDashboard?.dateRange ||
      storedDashboardFilter?.dateRange ||
      getDefaultDashboardDateRange()
  );
  const periodRef = useRef(period);
  const dateRangeRef = useRef(dateRange);
  const [stats, setStats] = useState(() => cachedDashboard?.stats || null);
  const [orders, setOrders] = useState(() => cachedDashboard?.orders || []);
  const [products, setProducts] = useState(
    () => cachedDashboard?.products || []
  );
  const [loading, setLoading] = useState(() => !cachedDashboard);
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
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
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
          dateRange: dateRangeRef.current,
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
    dateRangeRef.current = dateRange;
    if (dashboardCache) {
      dashboardCache.period = period;
      dashboardCache.dateRange = dateRange;
    }
    saveStoredDashboardFilter(dashboardFilterStorageKey, { period, dateRange });
  }, [dashboardFilterStorageKey, dateRange, period]);

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
      dateRange={dateRange}
      setDateRange={setDateRange}
      navigateFromDashboard={navigateFromDashboard}
    />
  );
};

export default AdminDashboard;
