import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // This is correct if in src/components/

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;