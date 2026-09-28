import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/ui/query-state';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { painLabel } from '@/lib/pain-scale';
import type { PatientSummary } from '@/types/clinical';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

interface CatalogItem {
  id: string;
  name: string;
}

export function SessionPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const { unitId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [painIn, setPainIn] = useState(5);
  const [painOut, setPainOut] = useState(3);
  const [note, setNote] = useState('');
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [otherTreatment, setOtherTreatment] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ['patient-summary', patientId, unitId],
    queryFn: () =>
      apiFetch<PatientSummary>(
        `/patients/${patientId}/summary${unitId ? `?unitId=${unitId}` : ''}`,
      ),
    enabled: !!patientId,
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['catalog', unitId],
    queryFn: () => apiFetch<CatalogItem[]>(`/units/${unitId}/catalog/treatments`),
    enabled: !!unitId,
  });

  const saveSession = useMutation({
    mutationFn: () =>
      apiFetch(`/units/${unitId}/plans/${summaryQuery.data?.activePlan?.id}/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          painIn,
          painOut,
          note: note || undefined,
          treatmentIds: selectedTreatments,
          otherTreatment: otherTreatment || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-summary', patientId] });
      qc.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
      qc.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Sesión registrada correctamente');
      navigate(`/patients/${patientId}`);
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo guardar la sesión'),
  });

  const summary = summaryQuery.data;
  const patientName = summary
    ? `${summary.patient.lastName}, ${summary.patient.firstName}`
    : 'Paciente';

  function toggleTreatment(id: string) {
    setShowValidation(false);
    setSelectedTreatments((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleSave() {
    if (selectedTreatments.length === 0 && !otherTreatment) {
      setShowValidation(true);
      return;
    }
    saveSession.mutate();
  }

  if (!summaryQuery.isLoading && summary && !summary.activePlan) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Registrar sesión"
          breadcrumbs={[
            { label: 'Pacientes', to: '/patients' },
            { label: patientName, to: `/patients/${patientId}` },
            { label: 'Sesión' },
          ]}
        />
        <div className="flex flex-col items-center justify-center rounded-lg border border-marcos-red/30 bg-marcos-red-light py-12 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-marcos-red" aria-hidden />
          <p className="font-medium text-ink">El paciente no tiene un plan activo</p>
          <p className="mt-1 max-w-sm text-sm text-marcos-red">
            Cree un plan de rehabilitación en la ficha del paciente antes de registrar una sesión.
          </p>
          <Button className="mt-4" asChild>
            <Link to={`/patients/${patientId}`}>Ir a la ficha del paciente</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sessionNumber = summary?.activePlan
    ? summary.activePlan.completedSessions + 1
    : 0;
  const totalSessions = summary?.activePlan?.plannedSessions ?? 0;

  return (
    <QueryState
      isLoading={summaryQuery.isLoading}
      isError={summaryQuery.isError}
      error={summaryQuery.error}
      onRetry={() => summaryQuery.refetch()}
      loadingFallback={<ListSkeleton rows={4} />}
    >
      {summary?.activePlan && (
        <div className="mx-auto max-w-2xl space-y-4">
          <PageHeader
            title="Registrar sesión"
            description={`Sesión ${sessionNumber} de ${totalSessions}`}
            breadcrumbs={[
              { label: 'Pacientes', to: '/patients' },
              { label: patientName, to: `/patients/${patientId}` },
              { label: 'Sesión' },
            ]}
          />

          <div className="h-2 w-full overflow-hidden rounded-full bg-pearl-300">
            <div
              className="h-full rounded-full bg-marcos-red transition-all"
              style={{
                width: `${Math.min(100, ((sessionNumber - 1) / totalSessions) * 100)}%`,
              }}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Datos de la sesión</CardTitle>
              <p className="text-sm text-ink-muted">{patientName}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="painIn">Dolor al entrar (0–10)</Label>
                  <Input
                    id="painIn"
                    type="range"
                    min={0}
                    max={10}
                    value={painIn}
                    onChange={(e) => setPainIn(Number(e.target.value))}
                    className="mt-2"
                  />
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-ink">{painIn}</span>
                    <span className="text-sm text-ink-muted">{painLabel(painIn)}</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="painOut">Dolor al salir (0–10)</Label>
                  <Input
                    id="painOut"
                    type="range"
                    min={0}
                    max={10}
                    value={painOut}
                    onChange={(e) => setPainOut(Number(e.target.value))}
                    className="mt-2"
                  />
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-ink">{painOut}</span>
                    <span className="text-sm text-ink-muted">{painLabel(painOut)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Tratamientos aplicados</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {catalog.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleTreatment(item.id)}
                      aria-pressed={selectedTreatments.includes(item.id)}
                      className={`rounded-full border px-3 py-1 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red ${
                        selectedTreatments.includes(item.id)
                          ? 'border-marcos-red bg-marcos-red-light text-marcos-red'
                          : 'border-pearl-300 text-ink-muted'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <Label htmlFor="otherTreatment">Otros</Label>
                  <Input
                    id="otherTreatment"
                    value={otherTreatment}
                    onChange={(e) => {
                      setOtherTreatment(e.target.value);
                      setShowValidation(false);
                    }}
                    placeholder="Otro tratamiento…"
                  />
                </div>
                {showValidation && (
                  <p className="mt-2 text-sm text-marcos-red" role="alert">
                    Seleccione al menos un tratamiento o indique uno en "Otros".
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="note">Nota breve (opcional)</Label>
                <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <Button onClick={handleSave} disabled={saveSession.isPending}>
                {saveSession.isPending ? 'Guardando…' : 'Guardar sesión'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </QueryState>
  );
}
