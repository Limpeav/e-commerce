import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";

const ConfirmDialog = ({
  open,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  isDark = false,
  loading = false,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 80);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [loading, onCancel, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          <Motion.button
            type="button"
            aria-label={cancelLabel}
            className={`absolute inset-0 cursor-default backdrop-blur-sm transition-colors ${
              isDark ? "bg-slate-950/80" : "bg-stone-950/45"
            }`}
            onClick={loading ? undefined : onCancel}
          />

          <Motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={`relative w-full max-w-md overflow-hidden rounded-[24px] border shadow-2xl ${
              isDark
                ? "border-[#313333] bg-[#222423] text-slate-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
                : "border-white/80 bg-white text-text-main shadow-stone-950/20"
            }`}
          >
            {isDark ? (
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
            ) : (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c94f4f] via-[#df795f] to-[#e6baa3]" />
            )}

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label={cancelLabel}
              className={`absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? "bg-[#2a2c2b] text-slate-400 hover:bg-[#323534] hover:text-white"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800"
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center px-6 pb-2 pt-8 text-center sm:px-8 sm:pt-9">
              <div
                className={`mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] border ${
                  isDark
                    ? "border-rose-400/30 bg-transparent text-[#e89098]"
                    : "border-rose-100 bg-rose-50 text-[#c94f4f]"
                }`}
              >
                <AlertTriangle className="h-[26px] w-[26px]" strokeWidth={1.5} />
              </div>

              <h2
                id={titleId}
                className={`px-4 text-[26px] font-bold tracking-tight ${
                  isDark ? "font-serif text-white" : ""
                }`}
              >
                {title}
              </h2>
              <p
                id={descriptionId}
                className={`mt-3 text-[15px] leading-relaxed ${
                  isDark ? "text-[#a1a1aa]" : "text-text-muted font-medium"
                }`}
              >
                {message}
              </p>
            </div>

            <div
              className={`mt-8 flex flex-col-reverse gap-3 border-t p-5 sm:flex-row sm:justify-center sm:gap-4 sm:px-6 ${
                isDark
                  ? "border-[#2e302f] bg-[#1a1c1b]"
                  : "border-stone-100 bg-stone-50/70"
              }`}
            >
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onCancel}
                disabled={loading}
                className={`h-11 flex-1 sm:flex-none sm:w-[130px] rounded-[14px] border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDark
                    ? "border-[#2b4231] bg-[#242b25] text-slate-200 hover:bg-[#2b352c]"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 font-bold"
                }`}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`inline-flex h-11 flex-1 sm:flex-none sm:w-[170px] items-center justify-center gap-2 rounded-[14px] px-5 text-sm font-semibold text-white shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#c94f4f]/35 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
                  isDark
                    ? "bg-[#cc5555] hover:bg-[#d66060] shadow-rose-900/20"
                    : "bg-[#c94f4f] hover:bg-[#a94040] shadow-rose-900/15 font-bold"
                }`}
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                )}
                {confirmLabel}
              </button>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmDialog;
