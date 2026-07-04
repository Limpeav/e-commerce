export const DASHBOARD_RESTORE_KEY = "adminDashboardShouldRestoreScroll";

export const getDashboardScrollKey = (adminUser) =>
  `adminDashboardScrollPosition:${
    adminUser?._id || adminUser?.email || "admin"
  }`;

export const readDashboardScrollPosition = (storage, scrollKey) => {
  const position = Number(storage.getItem(scrollKey) || 0);
  return Number.isFinite(position) && position > 0 ? position : 0;
};

export const saveDashboardScrollPosition = (
  storage,
  scrollKey,
  position,
  { markForRestore = false } = {}
) => {
  storage.setItem(scrollKey, String(Math.max(0, Number(position) || 0)));

  if (markForRestore) {
    storage.setItem(DASHBOARD_RESTORE_KEY, "true");
  }
};

export const shouldRestoreDashboardScroll = (pathname, storage) =>
  pathname === "/admin" &&
  storage.getItem(DASHBOARD_RESTORE_KEY) === "true";

export const completeDashboardScrollRestore = (storage) => {
  storage.removeItem(DASHBOARD_RESTORE_KEY);
};
