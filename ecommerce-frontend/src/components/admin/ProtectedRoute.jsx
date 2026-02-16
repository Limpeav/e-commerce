import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem("adminToken");
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "null");

  return adminToken && adminUser?.role === "admin"
    ? children
    : <Navigate to="/admin/login" />;
};

export default ProtectedRoute;
