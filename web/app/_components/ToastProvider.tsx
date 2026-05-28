"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOAST_DURATION_MS, TOAST_MAX_CONCURRENT } from "@/lib/copy";

export type ToastKind = "success" | "error" | "info";

export interface ToastOptions {
  action?: string;
  onAction?: () => void;
}

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind, opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Toast 全局 Provider + 顶层渲染。PR-3 ADR-20 + § 3.5.1。
 * FIFO 队列,最多同时 3 条。
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, kind: ToastKind = "info", opts?: ToastOptions) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => {
        const next = [...prev, { id, kind, message, action: opts?.action, onAction: opts?.onAction }];
        return next.slice(-TOAST_MAX_CONCURRENT);
      });
      const duration = TOAST_DURATION_MS[kind];
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-[var(--space-l)] z-50 flex -translate-x-1/2 flex-col gap-[var(--space-s)]"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto flex items-center gap-[var(--space-m)] rounded-[var(--radius-m)] px-[var(--space-l)] py-[var(--space-s)] text-sm shadow-lg ${
                t.kind === "success"
                  ? "bg-[var(--color-success)] text-white"
                  : t.kind === "error"
                    ? "bg-[var(--color-danger)] text-white"
                    : "bg-[var(--color-text-primary)] text-white"
              }`}
            >
              <span>{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.onAction?.();
                    dismiss(t.id);
                  }}
                  className="font-semibold underline underline-offset-2"
                >
                  {t.action}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast 必须在 <ToastProvider> 内调用");
  return ctx;
}
