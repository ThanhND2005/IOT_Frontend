import React, { useState, useCallback, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { ToastContext } from './ToastContext';
import type { ToastItem, ToastType } from './toastTypes';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'success', title, message, duration }),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'error', title, message, duration }),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'warning', title, message, duration }),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      showToast({ type: 'info', title, message, duration }),
    [showToast]
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
    }),
    [showToast, success, error, warning, info, removeToast]
  );

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={clsx(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg',
                'bg-white/95 backdrop-blur-md',
                toast.type === 'success' && 'border-emerald-200 shadow-emerald-500/10',
                toast.type === 'error' && 'border-rose-200 shadow-rose-500/10',
                toast.type === 'warning' && 'border-amber-200 shadow-amber-500/10',
                toast.type === 'info' && 'border-blue-200 shadow-blue-500/10'
              )}
              role="alert"
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border mt-0.5',
                  toast.type === 'success' && 'bg-emerald-50 text-emerald-600 border-emerald-100',
                  toast.type === 'error' && 'bg-rose-50 text-rose-600 border-rose-100',
                  toast.type === 'warning' && 'bg-amber-50 text-amber-600 border-amber-100',
                  toast.type === 'info' && 'bg-blue-50 text-blue-600 border-blue-100'
                )}
              >
                {getToastIcon(toast.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
