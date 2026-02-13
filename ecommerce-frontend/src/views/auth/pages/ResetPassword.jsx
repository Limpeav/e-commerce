import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ResetPassword now redirects to ForgotPassword since the flow is self-contained
const ResetPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/forgot-password", { replace: true });
  }, [navigate]);

  return null;
};

export default ResetPassword;
