import { AlertCircle } from "lucide-react";

const CheckoutError = ({ error, errorRef, isDark }) => {
  if (!error) {
    return null;
  }

  return (
    <div
      ref={errorRef}
      className={`border rounded-2xl p-4 flex items-center gap-3 animate-shake ${
        isDark ? "bg-red-500/10 border-red-500/20" : "border-red-200"
      }`}
      style={!isDark ? { backgroundColor: "#FDE8DD" } : undefined}
    >
      <AlertCircle className="w-5 h-5" style={{ color: isDark ? "#FCA5A5" : "#B45309" }} />
      <p className="font-medium text-sm" style={{ color: isDark ? "#FECACA" : "#7C2D12" }}>
        {error}
      </p>
    </div>
  );
};

export default CheckoutError;
