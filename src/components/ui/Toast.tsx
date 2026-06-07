"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-success shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-danger shrink-0" />,
  info: <Info className="h-4 w-4 text-info shrink-0" />,
};

const bgStyles: Record<ToastType, string> = {
  success: "border-success/20 bg-success/5",
  error: "border-danger/20 bg-danger/5",
  info: "border-info/20 bg-info/5",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 px-4 py-3 rounded-[var(--radius-card)] border shadow-[var(--shadow-card-hover)] text-sm text-foreground animate-in ${bgStyles[t.type]}`}
          >
            {icons[t.type]}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-muted hover:text-foreground shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
