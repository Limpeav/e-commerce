import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Info, AlertTriangle, AlertCircle } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

const toastVariants = {
    initial: { opacity: 0, y: 25, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const ToastItem = ({ id, type, message, description, onClose }) => {
    let Icon = Info;
    let bgClass = "bg-white";
    let borderClass = "border-stone-100";
    let iconClass = "bg-blue-100 text-blue-600";

    switch (type) {
        case "success":
            Icon = Check;
            iconClass = "bg-green-100 text-green-600";
            break;
        case "error":
            Icon = AlertCircle;
            iconClass = "bg-red-100 text-red-600";
            break;
        case "warning":
            Icon = AlertTriangle;
            iconClass = "bg-amber-100 text-amber-600";
            break;
        default:
            Icon = Info;
            iconClass = "bg-blue-100 text-blue-600";
    }

    return (
        <motion.div
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-4 rounded-2xl border ${borderClass} ${bgClass} p-4 shadow-xl shadow-stone-200/50 backdrop-blur-3xl`}
        >
            <div className={`rounded-xl p-2 ${iconClass}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 pt-0.5">
                <h3 className="text-sm font-bold text-stone-900">{message}</h3>
                {description && (
                    <p className="mt-1 text-xs font-medium text-stone-500">{description}</p>
                )}
            </div>
            <button
                onClick={() => onClose(id)}
                className="rounded-lg p-1 text-stone-400 opacity-0 transition-opacity hover:bg-stone-100 hover:text-stone-900 group-hover:opacity-100"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(({ type = "info", message, description, duration = 4000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message, description }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = (message, description) => addToast({ type: "success", message, description });
    const error = (message, description) => addToast({ type: "error", message, description });
    const warning = (message, description) => addToast({ type: "warning", message, description });
    const info = (message, description) => addToast({ type: "info", message, description });

    return (
        <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
            {children}
            <div className="fixed bottom-0 right-0 z-[9999] flex w-full flex-col gap-2 p-4 sm:max-w-[420px] pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} {...toast} onClose={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
