import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, message, type = "info", options = {}) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type, onClick: options.onClick }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title, message, options) => addToast(title, message, "success", options), [addToast]);
  const error = useCallback((title, message, options) => addToast(title, message, "error", options), [addToast]);
  const info = useCallback((title, message, options) => addToast(title, message, "info", options), [addToast]);

  const toastStyles = {
    success: {
      icon: CheckCircle2,
      container: "border-emerald-200 bg-white text-stone-900 shadow-[0_24px_60px_-28px_rgba(16,185,129,0.35)]",
      iconWrap: "bg-emerald-50 text-emerald-600",
    },
    error: {
      icon: AlertCircle,
      container: "border-rose-200 bg-white text-stone-900 shadow-[0_24px_60px_-28px_rgba(244,63,94,0.3)]",
      iconWrap: "bg-rose-50 text-rose-600",
    },
    info: {
      icon: Info,
      container: "border-stone-200 bg-white text-stone-900 shadow-[0_24px_60px_-28px_rgba(45,49,46,0.22)]",
      iconWrap: "bg-stone-100 text-primary-dark",
    },
  };

  return (
    <ToastContext.Provider value={{ success, error, info, toasts }}>
      {children}
      <div className="pointer-events-none fixed top-24 right-4 z-[120] flex w-[min(92vw,24rem)] flex-col gap-3">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;
          const isClickable = typeof toast.onClick === "function";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto overflow-hidden rounded-2xl border p-4 backdrop-blur-sm transition-all ${isClickable ? "cursor-pointer hover:-translate-y-0.5" : ""} ${style.container}`}
              role={isClickable ? "button" : "status"}
              tabIndex={isClickable ? 0 : undefined}
              aria-live="polite"
              onClick={() => {
                if (!isClickable) return;
                dismissToast(toast.id);
                toast.onClick();
              }}
              onKeyDown={(event) => {
                if (!isClickable || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                dismissToast(toast.id);
                toast.onClick();
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconWrap}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-5">{toast.title}</p>
                  {toast.message && (
                    <p className="mt-1 text-sm font-medium leading-5 text-stone-600">
                      {toast.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    dismissToast(toast.id);
                  }}
                  className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
