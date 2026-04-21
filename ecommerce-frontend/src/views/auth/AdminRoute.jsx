import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loading from "../../components/common/Loading";
import { AdminController } from "../../controllers/adminController";

// Admin Route - Only allows admin users
const AdminRoute = ({ children }) => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const validateAdminSession = async () => {
      const result = await AdminController.validateSession();

      if (!isMounted) {
        return;
      }

      setStatus(result.success ? "authorized" : "unauthorized");
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
