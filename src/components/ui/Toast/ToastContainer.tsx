"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast, type ToastType } from "./ToastContext";

const toastVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: 100, scale: 0.95 },
};

const toastStyles: Record<ToastType, string> = {
  error: "bg-danger text-white dark:bg-danger",
  success: "bg-success text-white dark:bg-success",
  info: "bg-info text-white dark:bg-info",
};

const toastIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export function ToastContainer(): React.ReactElement | null {
  const { toasts, hideToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];
          return (
            <motion.div
              key={toast.id}
              role="alert"
              aria-live="polite"
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
                min-w-[300px] max-w-[500px]
                ${toastStyles[toast.type]}
              `}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => hideToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-md opacity-80 hover:opacity-100
                           transition-opacity duration-fast focus-ring"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
