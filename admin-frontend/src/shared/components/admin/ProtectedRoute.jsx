import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const admin = JSON.parse(localStorage.getItem("admin"));
  return admin?.token ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
