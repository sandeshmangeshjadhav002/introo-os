import { useToastStore } from "../stores/useToastStore";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
  error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
  warning: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
};

const toastIconColors = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${toastColors[toast.type]}`}
          >
            {(() => {
              const Icon = toastIcons[toast.type];
              return <Icon className={`h-5 w-5 mt-0.5 ${toastIconColors[toast.type]}`} />;
            })()}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
