import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingFallback?: ReactNode;
  children: ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  error,
  onRetry,
  loadingFallback,
  children,
}: QueryStateProps) {
  if (isLoading) {
    return (
      loadingFallback ?? (
        <p className="text-ink-muted" aria-busy="true">
          Cargando…
        </p>
      )
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-marcos-red" aria-hidden />
        <p className="text-sm font-medium text-ink">No se pudo cargar la información</p>
        <p className="mt-1 text-sm text-ink-muted">
          {error?.message ?? 'Ocurrió un error inesperado'}
        </p>
        {onRetry && (
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
