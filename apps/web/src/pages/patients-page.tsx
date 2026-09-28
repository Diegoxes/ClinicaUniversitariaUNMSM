import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { UserTariffType } from '@clinica/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  district: string;
  tariffType: string;
  lastVisitDate: string | null;
}

export function PatientsPage() {
  const { unitId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: 30,
    phone: '',
    district: '',
    tariffType: UserTariffType.PARTICULAR,
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () =>
      apiFetch<PatientSearchResult[]>(
        `/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      ),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          age: Number(form.age),
          phone: form.phone || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      setShowForm(false);
      setForm({
        firstName: '',
        lastName: '',
        age: 30,
        phone: '',
        district: '',
        tariffType: UserTariffType.PARTICULAR,
      });
      toast.success('Paciente registrado correctamente');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo registrar el paciente'),
  });

  const addToQueue = useMutation({
    mutationFn: (patientId: string) =>
      apiFetch(`/units/${unitId}/queue`, {
        method: 'POST',
        body: JSON.stringify({ patientId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Paciente agregado a la cola del día');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo agregar a la cola'),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pacientes"
        description="Busque, registre y gestione las fichas clínicas"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Label htmlFor="patient-search">Buscar paciente</Label>
          <Input
            id="patient-search"
            placeholder="Nombre o apellido…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo paciente'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar paciente</CardTitle>
            <p className="text-sm text-ink-muted">
              Complete los datos básicos. Luego podrá agregarlo a la cola o abrir su ficha.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName">Nombres</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Apellidos</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="district">Distrito</Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tariffType">Tipo tarifario</Label>
              <select
                id="tariffType"
                className="h-10 w-full rounded-md border border-pearl-300 bg-pearl-50 px-3 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
                value={form.tariffType}
                onChange={(e) =>
                  setForm({ ...form, tariffType: e.target.value as UserTariffType })
                }
              >
                <option value={UserTariffType.PARTICULAR}>Particular</option>
                <option value={UserTariffType.WORKER}>Trabajador / docente</option>
                <option value={UserTariffType.STUDENT}>Estudiante</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.firstName || !form.lastName || !form.district}
              >
                Guardar paciente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resultados {isLoading ? '' : `(${patients.length})`}</CardTitle>
          <p className="text-sm text-ink-muted">
            Edad, distrito y última visita ayudan a distinguir homónimos
          </p>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading && <ListSkeleton rows={5} />}

          {!isLoading &&
            patients.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <Link
                    to={`/patients/${p.id}`}
                    className="font-medium text-ink hover:text-ink-muted hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marcos-red"
                  >
                    {p.lastName}, {p.firstName}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-ink-muted">
                    <span>{p.age} años</span>
                    <span>·</span>
                    <span>{p.district}</span>
                    <Badge>{p.tariffType}</Badge>
                    <span>
                      Última visita:{' '}
                      {p.lastVisitDate
                        ? new Date(p.lastVisitDate).toLocaleDateString('es-PE')
                        : 'Sin visitas'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToQueue.mutate(p.id)}
                    disabled={!unitId}
                  >
                    Agregar a cola
                  </Button>
                  <Button size="sm" asChild>
                    <Link to={`/patients/${p.id}`}>Ver ficha</Link>
                  </Button>
                </div>
              </div>
            ))}

          {!isLoading && patients.length === 0 && (
            <EmptyState
              icon={search ? Search : UserPlus}
              title={search ? 'Sin resultados' : 'No hay pacientes registrados'}
              description={
                search
                  ? 'Pruebe con otro nombre o apellido, o registre un paciente nuevo.'
                  : 'Comience registrando el primer paciente de la clínica.'
              }
              action={
                !showForm ? (
                  <Button onClick={() => setShowForm(true)}>Nuevo paciente</Button>
                ) : undefined
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
