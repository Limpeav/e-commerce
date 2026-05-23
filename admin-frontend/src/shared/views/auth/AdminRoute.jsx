import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Loading from "../../components/common/Loading";
import { AdminController } from "../../controllers/adminController";
import { getPortalLoginPath, getStoredAdminUser } from "../../utils/adminSession";

// Admin Route - Only allows admin users
const AdminRoute = ({ children, allowedRoles }) => {
  const [status, setStatus] = useState("checking");
  const [redirectPath, setRedirectPath] = useState("/admin/login");

  useEffect(() => {
    let isMounted = true;

    const validateAdminSession = async () => {
      const storedAdminUser = getStoredAdminUser();
      setRedirectPath(getPortalLoginPath(storedAdminUser));
      const result = await AdminController.validateSession();

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

    validateAdminSession();

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
