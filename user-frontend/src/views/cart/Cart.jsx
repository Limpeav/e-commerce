import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/useCart";

export default function Cart() {
  const { openCartDrawer } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/customer", { replace: true });
    openCartDrawer();
  }, [navigate, openCartDrawer]);

  return null;
}
