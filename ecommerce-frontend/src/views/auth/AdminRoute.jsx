import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loading from "../../components/common/Loading";
import { adminService } from "../../services/adminService";
import {
  clearAdminSession,
  getStoredAdminUser,
  getStoredAdminToken,
} from "../../utils/adminSession";

// Admin Route - Only allows admin users
const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const validateAdminSession = async () => {
      const adminToken = getStoredAdminToken();
      const adminUser = getStoredAdminUser();

      if (!adminToken || !adminUser || adminUser.role !== "admin") {
        if (isMounted) {
          setStatus("unauthorized");
        }
        return;
      }

      try {
        const { data } = await adminService.getCurrentAdmin();

        if (!data || data.role !== "admin") {
          throw new Error("Invalid admin session");
        }

        localStorage.setItem("adminUser", JSON.stringify({ ...adminUser, ...data }));

        if (isMounted) {
          setStatus("authorized");
        }
      } catch (error) {
        clearAdminSession();

        if (isMounted) {
          setStatus("unauthorized");
        }
      }
    };

    validateAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "checking") {
    return <Loading />;
  }

  if (status !== "authorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
