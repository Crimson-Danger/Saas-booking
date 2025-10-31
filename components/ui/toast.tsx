"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; title?: string; description?: string; variant?: "success" | "error" | "default" };

const ToastContext = React.createContext<{
  show: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(1);
  const show = React.useCallback((t: Omit<Toast, "id">) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-md border p-3 shadow-sm bg-card text-card-foreground",
              t.variant === "success" && "border-green-300",
              t.variant === "error" && "border-red-300"
            )}
          >
            {t.title && <div className="text-sm font-medium">{t.title}</div>}
            {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

