import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/ui/query-state';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import {
  IntakePath,
  PatientVisitType,
  PlanClosureReason,
  PlanOrigin,
} from '@clinica/shared';
import type { PatientSummary, PatientTimeline } from '@/types/clinical';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { unitId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [plannedSessions, setPlannedSessions] = useState(8);
  const [confirmClose, setConfirmClose] = useState<PlanClosureReason | null>(null);
  const [visitForm, setVisitForm] = useState({
    intakePath: IntakePath.EXTERNAL,
    diagnosis: '',
    visitType: PatientVisitType.NEW,
    referralReason: '',
    referralInstructions: '',
  });

  const summaryQuery = useQuery({
    queryKey: ['patient-summary', id, unitId],
    queryFn: () =>
      apiFetch<PatientSummary>(
        `/patients/${id}/summary${unitId ? `?unitId=${unitId}` : ''}`,
      ),
    enabled: !!id,
  });

  const timelineQuery = useQuery({
    queryKey: ['patient-timeline', id],
    queryFn: () => apiFetch<PatientTimeline>(`/patients/${id}/timeline`),
    enabled: !!id,
  });

  const createVisit = useMutation({
    mutationFn: () =>
      apiFetch(`/units/${unitId}/visits`, {
        method: 'POST',
        body: JSON.stringify({ patientId: id, ...visitForm }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-summary', id] });
      qc.invalidateQueries({ queryKey: ['patient-timeline', id] });
      toast.success('Ingreso del día registrado');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo registrar el ingreso'),
  });

  const createPlan = useMutation({
    mutationFn: () =>
      apiFetch(`/units/${unitId}/plans`, {
        method: 'POST',
        body: JSON.stringify({
          patientId: id,
          plannedSessions,
          origin: PlanOrigin.THERAPIST_EVAL,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-summary', id] });
      qc.invalidateQueries({ queryKey: ['patient-timeline', id] });
      toast.success('Plan de rehabilitación creado');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo crear el plan'),
  });

  const closePlan = useMutation({
    mutationFn: (reason: PlanClosureReason) =>
      apiFetch(`/units/${unitId}/plans/${summaryQuery.data?.activePlan?.id}/close`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-summary', id] });
      qc.invalidateQueries({ queryKey: ['patient-timeline', id] });
      toast.success('Plan cerrado correctamente');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo cerrar el plan'),
  });

  const summary = summaryQuery.data;
  const patientName = summary
    ? `${summary.patient.lastName}, ${summary.patient.firstName}`
    : 'Paciente';

  const closeLabels: Record<PlanClosureReason, { title: string; description: string }> = {
    [PlanClosureReason.DISCHARGE]: {
      title: 'Dar de alta',
      description: '¿Confirma que el paciente recibe el alta del plan de rehabilitación?',
    },
    [PlanClosureReason.MEDICAL_REEVAL]: {
      title: 'Reevaluación médica',
      description: '¿Confirma que el paciente será derivado a reevaluación médica?',
    },
  };

  function handleConfirmClose() {
    if (!confirmClose) return;
    closePlan.mutate(confirmClose);
    setConfirmClose(null);
  }

  return (
    <QueryState
      isLoading={summaryQuery.isLoading}
      isError={summaryQuery.isError}
      error={summaryQuery.error}
      onRetry={() => summaryQuery.refetch()}
      loadingFallback={<ListSkeleton rows={3} />}
    >
      {summary && (
        <div className="space-y-6">
          <PageHeader
            title="Ficha del paciente"
            breadcrumbs={[
              { label: 'Pacientes', to: '/patients' },
              { label: patientName },
            ]}
          />

          {/* Datos del paciente */}
          <section aria-labelledby="patient-data-heading">
            <h3 id="patient-data-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-marcos-red">
              Datos del paciente
            </h3>
            <Card>
              <CardHeader>
                <CardTitle>{patientName}</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-ink-muted">
                  <span>{summary.patient.age} años</span>
                  <span>{summary.patient.district}</span>
                  <Badge>{summary.patient.tariffType}</Badge>
                  {summary.patient.phone && <span>{summary.patient.phone}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-marcos-red/20 bg-marcos-red-light p-4 shadow-inner">
                  <h4 className="font-medium text-ink">Resumen clínico</h4>
                  {summary.activePlan ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm">
                        Sesión {summary.activePlan.completedSessions + 1} de{' '}
                        {summary.activePlan.plannedSessions} — {summary.activePlan.status}
                      </p>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-pearl-300">
                        <div
                          className="h-full rounded-full bg-marcos-red transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (summary.activePlan.completedSessions /
                                summary.activePlan.plannedSessions) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-marcos-red">
                      Sin plan activo. Cree un plan de rehabilitación para poder registrar sesiones.
                    </p>
                  )}
                  {summary.lastSession && (
                    <p className="mt-2 text-sm">
                      Última sesión ({new Date(summary.lastSession.date).toLocaleDateString('es-PE')}):
                      dolor {summary.lastSession.painIn}→{summary.lastSession.painOut} —{' '}
                      {summary.lastSession.treatments.join(', ')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Acciones de hoy */}
          <section aria-labelledby="today-actions-heading">
            <h3 id="today-actions-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-marcos-red">
              Acciones de hoy
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base">Registrar ingreso del día</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Input
                    id="diagnosis"
                    value={visitForm.diagnosis}
                    onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })}
                  />
                  <Label htmlFor="intakePath">Vía de ingreso</Label>
                  <select
                    id="intakePath"
                    className="h-10 w-full rounded-md border border-pearl-300 bg-pearl-50 px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
                    value={visitForm.intakePath}
                    onChange={(e) =>
                      setVisitForm({ ...visitForm, intakePath: e.target.value as IntakePath })
                    }
                  >
                    <option value={IntakePath.EXTERNAL}>Externo</option>
                    <option value={IntakePath.REFERRED}>Derivado por médico</option>
                  </select>
                  {visitForm.intakePath === IntakePath.REFERRED && (
                    <>
                      <Label htmlFor="referralReason">Motivo de derivación</Label>
                      <Input
                        id="referralReason"
                        value={visitForm.referralReason}
                        onChange={(e) =>
                          setVisitForm({ ...visitForm, referralReason: e.target.value })
                        }
                      />
                      <Label htmlFor="referralInstructions">Indicaciones médicas</Label>
                      <Input
                        id="referralInstructions"
                        value={visitForm.referralInstructions}
                        onChange={(e) =>
                          setVisitForm({ ...visitForm, referralInstructions: e.target.value })
                        }
                      />
                    </>
                  )}
                  <Label htmlFor="visitType">Tipo visita</Label>
                  <select
                    id="visitType"
                    className="h-10 w-full rounded-md border border-pearl-300 bg-pearl-50 px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
                    value={visitForm.visitType}
                    onChange={(e) =>
                      setVisitForm({ ...visitForm, visitType: e.target.value as PatientVisitType })
                    }
                  >
                    <option value={PatientVisitType.NEW}>Nuevo</option>
                    <option value={PatientVisitType.RETURNING}>Reincidente</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={() => createVisit.mutate()}
                    disabled={!unitId || !visitForm.diagnosis}
                  >
                    Registrar ingreso
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plan de rehabilitación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label htmlFor="plannedSessions">Sesiones previstas</Label>
                  <Input
                    id="plannedSessions"
                    type="number"
                    min={6}
                    max={10}
                    value={plannedSessions}
                    onChange={(e) => setPlannedSessions(Number(e.target.value))}
                  />
                  {!summary.activePlan ? (
                    <>
                      <p className="text-sm text-ink-muted">
                        Cree un plan para habilitar el registro de sesiones clínicas.
                      </p>
                      <Button size="sm" onClick={() => createPlan.mutate()} disabled={!unitId}>
                        Crear plan
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmClose(PlanClosureReason.DISCHARGE)}
                      >
                        Alta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmClose(PlanClosureReason.MEDICAL_REEVAL)}
                      >
                        Reevaluación médica
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/patients/${id}/session`}>Registrar sesión</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Historial */}
          <section aria-labelledby="history-heading">
            <h3 id="history-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-marcos-red">
              Historial
            </h3>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sesiones anteriores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {timelineQuery.isLoading && <ListSkeleton rows={3} />}
                {!timelineQuery.isLoading &&
                  timelineQuery.data?.sessions?.map((s) => (
                    <div key={s.id} className="rounded border p-3 text-sm">
                      <p className="font-medium">
                        {new Date(s.sessionDate).toLocaleString('es-PE')} — {s.professional.fullName}
                      </p>
                      <p>
                        Dolor: {s.painIn ?? '-'} → {s.painOut ?? '-'}
                      </p>
                      <p>
                        Tratamientos:{' '}
                        {s.treatments
                          .map((t) => t.catalogItem?.name ?? t.otherText)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {s.note && <p className="text-ink-muted">{s.note}</p>}
                    </div>
                  ))}
                {!timelineQuery.isLoading && !timelineQuery.data?.sessions?.length && (
                  <p className="py-4 text-center text-ink-muted">Sin sesiones registradas</p>
                )}
              </CardContent>
            </Card>
          </section>

          <ConfirmDialog
            open={!!confirmClose}
            title={confirmClose ? closeLabels[confirmClose].title : ''}
            description={confirmClose ? closeLabels[confirmClose].description : ''}
            confirmLabel="Confirmar"
            variant="destructive"
            onConfirm={handleConfirmClose}
            onCancel={() => setConfirmClose(null)}
          />
        </div>
      )}
    </QueryState>
  );
}
