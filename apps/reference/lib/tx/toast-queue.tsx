"use client";

/**
 * Story 7.10 — toast queue + viewport.
 *
 * Story 7.4 ships only the shadcn `Toast` *surface*; the project caveat is
 * that consumers must wrap it with their own queue + viewport. This module
 * does exactly that:
 *
 *   - `<ToastQueueProvider>` owns the toast list state and is mounted by
 *     the locale layout so every locale-prefixed route has access.
 *   - `useToastQueue()` exposes `push`, `dismiss`, and the active queue so
 *     `TransactionConfirmModal` (and future Stories 7.14 / 7.15 / 7.11) can
 *     surface success / error / warn toasts without prop-drilling.
 *   - The viewport renders inside the provider and is positioned via
 *     logical Tailwind classes (`bottom-4 end-4`) so RTL locales auto-flip
 *     per Story 7.18 (UX-DR40).
 *
 * Receipts are *never* replaced by toasts (UX-DR21) — toasts are
 * informational status, while `<ReceiptCard>` is the persistent receipt of
 * record. The two surfaces are intentionally complementary.
 */

import * as React from "react";
import {
  Toast,
  ToastDescription,
  ToastTitle,
  type ToastProps,
} from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type ToastVariant = NonNullable<ToastProps["variant"]>;

export interface QueuedToast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms. `0` means "sticky". Default 5_000. */
  durationMs?: number;
}

interface ToastQueueContextValue {
  toasts: readonly QueuedToast[];
  push(toast: Omit<QueuedToast, "id"> & { id?: string }): string;
  dismiss(id: string): void;
}

const ToastQueueContext = React.createContext<ToastQueueContextValue | null>(null);

let counter = 0;
function nextId(): string {
  counter += 1;
  return `t-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function ToastQueueProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<readonly QueuedToast[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = React.useCallback<ToastQueueContextValue["push"]>(
    (toast) => {
      const id = toast.id ?? nextId();
      const queued: QueuedToast = { ...toast, id };
      setToasts((prev) => [...prev, queued]);
      const duration = queued.durationMs ?? 5_000;
      if (duration > 0 && typeof window !== "undefined") {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    // Snapshot the ref so the cleanup closure reads the same Map reference
    // even if React replaces `timersRef.current` on a future render.
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const value = React.useMemo<ToastQueueContextValue>(
    () => ({ toasts, push, dismiss }),
    [toasts, push, dismiss],
  );

  return (
    <ToastQueueContext.Provider value={value}>
      {children}
      <ToastQueueViewport toasts={toasts} onDismiss={dismiss} />
    </ToastQueueContext.Provider>
  );
}

export function useToastQueue(): ToastQueueContextValue {
  const ctx = React.useContext(ToastQueueContext);
  if (!ctx) {
    throw new Error(
      "useToastQueue must be called inside a <ToastQueueProvider>. Mount the provider in app/[locale]/layout.tsx.",
    );
  }
  return ctx;
}

function ToastQueueViewport({
  toasts,
  onDismiss,
}: {
  toasts: readonly QueuedToast[];
  onDismiss: (id: string) => void;
}) {
  // Logical positioning so RTL locales render the viewport on the visual
  // start side. `pointer-events-none` on the viewport keeps the rest of
  // the page interactive; individual toasts re-enable pointer events.
  return (
    <div
      data-testid="toast-queue-viewport"
      className={cn(
        "pointer-events-none fixed bottom-4 end-4 z-50 flex w-full max-w-sm flex-col gap-2",
      )}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant ?? "default"} className="pointer-events-auto">
          <div className="flex flex-1 flex-col gap-1">
            {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
            {t.description ? <ToastDescription>{t.description}</ToastDescription> : null}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className={cn(
              "shrink-0 rounded-sm px-2 py-1 text-caption font-medium text-muted",
              "hover:text-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            )}
          >
            Close
          </button>
        </Toast>
      ))}
    </div>
  );
}
