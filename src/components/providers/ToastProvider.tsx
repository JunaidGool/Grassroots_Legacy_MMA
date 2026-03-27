"use client";

import { createContext, useCallback, useState, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const typeStyles: Record<ToastType, string> = {
    success: "bg-success/90 text-white",
    error: "bg-danger/90 text-white",
    info: "bg-dark-500/90 text-foreground",
  };

  return (
    <ToastContext value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
              animate-slide-up cursor-pointer text-sm font-medium
              ${typeStyles[t.type]}
            `}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
