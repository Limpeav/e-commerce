import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loading from "../../components/common/Loading";
import { AdminController } from "../../controllers/adminController";

// Admin Route - Only allows admin users
const AdminRoute = ({ children, allowedRoles }) => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    const validateAdminSession = async () => {
      const result = await AdminController.validateSession();

      if (!isMounted) {
        return;
      }

      if (!result.success) {
        setStatus("unauthorized");
        return;
      }

      if (allowedRoles?.length && !allowedRoles.includes(result.data?.role)) {
        setStatus("unauthorized");
        return;
      }

      setStatus("authorized");
    };

    validateAdminSession();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles]);

  if (status === "checking") {
    return <Loading />;
  }

  if (status !== "authorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminRoute;
