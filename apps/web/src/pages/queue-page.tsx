import { PageHeader } from '@/components/layout/page-header';
import { WorkflowGuide } from '@/components/queue/workflow-guide';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { QueueStatusBadge } from '@/lib/queue-status';
import type { PatientSummary } from '@/types/clinical';
import { QueueEntryStatus } from '@clinica/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, UserPlus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface QueueEntry {
  id: string;
  position: number;
  status: QueueEntryStatus;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    district: string;
  };
}

function SessionButton({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { unitId } = useAuth();
  const { toast } = useToast();

  const { data: summary } = useQuery({
    queryKey: ['patient-summary', patientId, unitId],
    queryFn: () =>
      apiFetch<PatientSummary>(
        `/patients/${patientId}/summary${unitId ? `?unitId=${unitId}` : ''}`,
      ),
    enabled: !!patientId && !!unitId,
  });

  const hasPlan = !!summary?.activePlan;

  if (!hasPlan && summary !== undefined) {
    return (
      <Button
        size="sm"
        variant="outline"
        title="Este paciente necesita un plan activo. Vaya a la ficha para crearlo."
        onClick={() =>
          toast.info(
            `${patientName} no tiene plan activo. Cree un plan en la ficha del paciente antes de registrar la sesión.`,
          )
        }
      >
        Registrar sesión
      </Button>
    );
  }

  return (
    <Button size="sm" asChild>
      <Link to={`/patients/${patientId}/session`}>Registrar sesión</Link>
    </Button>
  );
}

export function QueuePage() {
  const { unitId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState('');
  const [confirmDone, setConfirmDone] = useState<{ entryId: string; name: string } | null>(null);

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['queue', unitId, date],
    queryFn: () => apiFetch<QueueEntry[]>(`/units/${unitId}/queue?date=${date}`),
    enabled: !!unitId,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['patients-search-queue', search],
    queryFn: () =>
      apiFetch<Array<{ id: string; firstName: string; lastName: string }>>(
        `/patients?search=${encodeURIComponent(search)}`,
      ),
    enabled: search.length >= 2,
  });

  const addToQueue = useMutation({
    mutationFn: (patientId: string) =>
      apiFetch(`/units/${unitId}/queue?date=${date}`, {
        method: 'POST',
        body: JSON.stringify({ patientId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue', unitId, date] });
      setSearch('');
      toast.success('Paciente agregado a la cola');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo agregar a la cola'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ entryId, status }: { entryId: string; status: QueueEntryStatus }) =>
      apiFetch(`/units/${unitId}/queue/${entryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['queue', unitId, date] });
      const messages: Partial<Record<QueueEntryStatus, string>> = {
        [QueueEntryStatus.IN_PROGRESS]: 'Atención iniciada',
        [QueueEntryStatus.DONE]: 'Atención finalizada',
      };
      if (messages[variables.status]) {
        toast.success(messages[variables.status]!);
      }
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo actualizar el estado'),
  });

  const moveUp = useMutation({
    mutationFn: (entryIds: string[]) =>
      apiFetch(`/units/${unitId}/queue/reorder?date=${date}`, {
        method: 'PATCH',
        body: JSON.stringify({ entryIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue', unitId, date] });
      toast.success('Orden actualizado');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo reordenar la cola'),
  });

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const ids = queue.map((e) => e.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    moveUp.mutate(ids);
  }

  function handleConfirmDone() {
    if (!confirmDone) return;
    updateStatus.mutate({
      entryId: confirmDone.entryId,
      status: QueueEntryStatus.DONE,
    });
    setConfirmDone(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cola del día"
        description="Gestione el orden de atención de los pacientes del día"
      />

      <WorkflowGuide />

      <div className="rounded-xl border border-pearl-300 bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-marcos-red">
          Agregar pacientes
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="queue-date">Fecha</Label>
            <Input
              id="queue-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="queue-search">Agregar paciente a la cola</Label>
            <Input
              id="queue-search"
              ref={searchInputRef}
              placeholder="Buscar por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="mt-1 overflow-hidden rounded-md border border-marcos-red/20 bg-marcos-red-light/50 shadow-sm">
                {searchResults.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="block w-full border-b border-marcos-red/15 px-3 py-2 text-left text-sm text-ink last:border-0 hover:bg-white focus-visible:bg-white focus-visible:outline-none"
                    onClick={() => addToQueue.mutate(p.id)}
                  >
                    {p.lastName}, {p.firstName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orden de llegada</CardTitle>
          <p className="text-sm text-ink-muted">
            {isLoading ? 'Cargando…' : `${queue.length} pacientes en cola`}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <ListSkeleton rows={4} />}

          {!isLoading &&
            queue.map((entry, index) => {
              const patientName = `${entry.patient.lastName}, ${entry.patient.firstName}`;
              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-pearl-300 bg-pearl-50/80 p-3 transition-colors hover:border-marcos-red/20 hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-marcos-red-light text-sm font-bold text-ink">
                  {entry.position}
                </span>
                <div>
                  <Link
                    to={`/patients/${entry.patient.id}`}
                    className="font-medium text-ink hover:text-ink-muted hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
                  >
                    {patientName}
                  </Link>
                  <p className="text-sm text-ink-muted">
                        {entry.patient.age} años · {entry.patient.district}
                      </p>
                    </div>
                    <QueueStatusBadge status={entry.status} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.status !== QueueEntryStatus.DONE && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        aria-label={`Subir posición de ${patientName}`}
                      >
                        ↑ Subir
                      </Button>
                    )}
                    {entry.status === QueueEntryStatus.WAITING && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateStatus.mutate({
                            entryId: entry.id,
                            status: QueueEntryStatus.IN_PROGRESS,
                          })
                        }
                      >
                        Iniciar atención
                      </Button>
                    )}
                    {entry.status === QueueEntryStatus.IN_PROGRESS && (
                      <>
                        <SessionButton
                          patientId={entry.patient.id}
                          patientName={patientName}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setConfirmDone({ entryId: entry.id, name: patientName })
                          }
                        >
                          Finalizar atención
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          {!isLoading && queue.length === 0 && (
            <EmptyState
              icon={ClipboardList}
              title="Cola vacía"
              description="Agregue pacientes buscándolos arriba o regístre uno nuevo en la sección de Pacientes."
              action={
                <Button onClick={() => searchInputRef.current?.focus()}>
                  Buscar paciente
                </Button>
              }
              secondaryAction={
                <Button variant="outline" asChild>
                  <Link to="/patients">
                    <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                    Registrar paciente nuevo
                  </Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDone}
        title="Finalizar atención"
        description={`¿Confirma que la atención de ${confirmDone?.name ?? 'este paciente'} ha terminado?`}
        confirmLabel="Sí, finalizar"
        onConfirm={handleConfirmDone}
        onCancel={() => setConfirmDone(null)}
      />
    </div>
  );
}
