import { ToastContext, ToastVariant } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const TOAST_DURATION_MS = 4000;

const variantStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-marcos-red/30 bg-marcos-red-light text-marcos-red-dark',
  info: 'border-marcos-red/20 bg-marcos-red-light text-ink',
};

const variantIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; variant: ToastVariant }>
  >([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toasts,
      dismiss,
      toast: {
        success: (message: string) => addToast(message, 'success'),
        error: (message: string) => addToast(message, 'error'),
        info: (message: string) => addToast(message, 'info'),
      },
    }),
    [toasts, dismiss, addToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx || ctx.toasts.length === 0) return null;

  const { toasts, dismiss } = ctx;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => {
        const Icon = variantIcons[t.variant];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg',
              variantStyles[t.variant],
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
