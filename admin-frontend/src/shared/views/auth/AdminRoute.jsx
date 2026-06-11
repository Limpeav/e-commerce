import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loading from "../../components/common/Loading";
import { AdminController } from "../../controllers/adminController";
import {
  getPortalLoginPath,
  getStoredAdminToken,
  getStoredAdminUser,
} from "../../utils/adminSession";

const SESSION_CACHE_TTL = 60_000;
let cachedSession = null;
let cachedSessionAt = 0;
let cachedSessionToken = null;
let sessionValidationPromise = null;

const getCachedSession = () => {
  const storedToken = getStoredAdminToken();
  return cachedSession &&
    storedToken &&
    storedToken === cachedSessionToken &&
    Date.now() - cachedSessionAt < SESSION_CACHE_TTL
    ? cachedSession
    : null;
};

const validateAdminSession = async () => {
  const currentSession = getCachedSession();
  if (currentSession) return { success: true, data: currentSession };

  if (!sessionValidationPromise) {
    sessionValidationPromise = AdminController.validateSession()
      .then((result) => {
        if (result.success) {
          cachedSession = result.data;
          cachedSessionAt = Date.now();
          cachedSessionToken = getStoredAdminToken();
        } else {
          cachedSession = null;
          cachedSessionAt = 0;
          cachedSessionToken = null;
        }

        return result;
      })
      .finally(() => {
        sessionValidationPromise = null;
      });
  }

  return sessionValidationPromise;
};

// Admin Route - Only allows admin users
const AdminRoute = ({ children, allowedRoles }) => {
  const initialSession = getCachedSession();
  const [status, setStatus] = useState(() =>
    initialSession &&
    (!allowedRoles?.length || allowedRoles.includes(initialSession.role))
      ? "authorized"
      : "checking"
  );
  const [redirectPath, setRedirectPath] = useState("/admin/login");

  useEffect(() => {
    let isMounted = true;

    const checkAdminSession = async () => {
      const storedAdminUser = getStoredAdminUser();
      setRedirectPath(getPortalLoginPath(storedAdminUser));
      const result = await validateAdminSession();

      if (!isMounted) {
        return;
      }

      if (!result.success) {
        setStatus("unauthorized");
        return;
      }

      if (allowedRoles?.length && !allowedRoles.includes(result.data?.role)) {
        setRedirectPath(getPortalLoginPath(result.data));
        setStatus("unauthorized");
        return;
      }

      setStatus("authorized");
    };

    checkAdminSession();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles]);

  if (status === "checking") {
    return <Loading />;
  }

  if (status !== "authorized") {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default AdminRoute;
