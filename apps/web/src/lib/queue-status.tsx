import { Badge } from '@/components/ui/badge';
import { QueueEntryStatus } from '@clinica/shared';

export const statusLabel: Record<QueueEntryStatus, string> = {
  WAITING: 'En espera',
  IN_PROGRESS: 'En atención',
  DONE: 'Atendido',
};

export const statusBadgeClass: Record<QueueEntryStatus, string> = {
  WAITING: 'bg-marcos-red-light text-marcos-red',
  IN_PROGRESS: 'bg-marcos-red text-white',
  DONE: 'bg-pearl-200 text-ink-muted',
};

export function QueueStatusBadge({ status }: { status: QueueEntryStatus }) {
  return <Badge className={statusBadgeClass[status]}>{statusLabel[status]}</Badge>;
}
