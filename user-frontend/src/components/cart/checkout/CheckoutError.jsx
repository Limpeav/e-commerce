import { AlertCircle } from "lucide-react";

const CheckoutError = ({ error, errorRef, isDark }) => {
  if (!error) {
    return null;
  }

  return (
    <div
      ref={errorRef}
      className="flex items-center gap-3 px-1 animate-shake"
    >
      <AlertCircle className="w-5 h-5" style={{ color: isDark ? "#FCA5A5" : "#B45309" }} />
      <p className="font-medium text-sm" style={{ color: isDark ? "#FECACA" : "#7C2D12" }}>
        {error}
      </p>
    </div>
  );
};

export default CheckoutError;
