"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";

interface ToastInput {
  message: string;
  action?: { label: string; onClick: () => void };
  tone?: "default" | "error";
  /** ms, default 6000 */
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const { d } = useI18n();

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(
    (t: ToastInput) => {
      if (timer.current) clearTimeout(timer.current);
      const id = ++seq.current;
      setToast({ ...t, id });
      timer.current = setTimeout(() => {
        setToast((cur) => (cur?.id === id ? null : cur));
      }, t.duration ?? 6000);
    },
    [],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
        role="status"
        aria-live="polite"
      >
        {toast && (
          <div
            key={toast.id}
            className="enter pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-box bg-ink py-2 pl-4 pr-2 text-bg shadow-[0_8px_30px_rgb(23_22_23/0.25)]"
          >
            <p className={`flex-1 py-2 text-sm ${toast.tone === "error" ? "font-medium" : ""}`}>
              {toast.message}
            </p>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action!.onClick();
                  dismiss();
                }}
                className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink active:scale-[0.98]"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label={d.common.close}
              className="grid size-11 place-items-center rounded-full text-lg opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
