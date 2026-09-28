import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { GlobalRole, UnitRole } from '@clinica/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  globalRole: string;
  active: boolean;
}

interface CatalogItem {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
}

export function AdminPage() {
  const { user, unitId } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newItemName, setNewItemName] = useState('');
  const [settings, setSettings] = useState({ defaultPlannedSessions: 8 });
  const [confirmDeactivate, setConfirmDeactivate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (user?.globalRole !== GlobalRole.ADMIN) {
    return <Navigate to="/queue" replace />;
  }

  const { data: staff = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch<StaffUser[]>('/admin/users'),
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ['catalog-all', unitId],
    queryFn: () =>
      apiFetch<CatalogItem[]>(`/units/${unitId}/catalog/treatments?all=true`),
    enabled: !!unitId,
  });

  const { data: unitSettings } = useQuery({
    queryKey: ['settings', unitId],
    queryFn: () =>
      apiFetch<{ defaultPlannedSessions: number }>(`/units/${unitId}/settings`),
    enabled: !!unitId,
  });

  const addCatalogItem = useMutation({
    mutationFn: () =>
      apiFetch(`/units/${unitId}/catalog/treatments`, {
        method: 'POST',
        body: JSON.stringify({ name: newItemName, sortOrder: catalog.length + 1 }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-all', unitId] });
      setNewItemName('');
      toast.success('Tratamiento agregado al catálogo');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo agregar el tratamiento'),
  });

  const toggleCatalogItem = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch(`/units/${unitId}/catalog/treatments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['catalog-all', unitId] });
      toast.success(variables.active ? 'Tratamiento activado' : 'Tratamiento desactivado');
    },
    onError: (err: Error) => toast.error(err.message ?? 'No se pudo actualizar el tratamiento'),
  });

  const saveSettings = useMutation({
    mutationFn: () =>
      apiFetch(`/units/${unitId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => toast.success('Parámetros guardados'),
    onError: (err: Error) => toast.error(err.message ?? 'No se pudieron guardar los parámetros'),
  });

  function handleConfirmDeactivate() {
    if (!confirmDeactivate) return;
    toggleCatalogItem.mutate({ id: confirmDeactivate.id, active: false });
    setConfirmDeactivate(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Administración"
        description="Gestione usuarios, catálogo de tratamientos y parámetros de la unidad"
      />

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del sistema</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {staff.map((s) => (
            <div key={s.id} className="flex justify-between py-2 text-sm">
              <span>
                {s.fullName} ({s.username}) — {s.globalRole}
              </span>
              <span className={s.active ? 'text-green-600' : 'text-red-600'}>
                {s.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))}
          <p className="pt-2 text-xs text-ink-muted">
            Roles de unidad: {UnitRole.THERAPIST}, {UnitRole.SUPERVISOR}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de tratamientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {catalog.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <span className={item.active ? 'text-ink' : 'text-pearl-400 line-through'}>
                {item.name}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (item.active) {
                    setConfirmDeactivate({ id: item.id, name: item.name });
                  } else {
                    toggleCatalogItem.mutate({ id: item.id, active: true });
                  }
                }}
              >
                {item.active ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Nuevo tratamiento…"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Button onClick={() => addCatalogItem.mutate()} disabled={!newItemName}>
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parámetros de la unidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="defaultSessions">Sesiones previstas por defecto</Label>
            <Input
              id="defaultSessions"
              type="number"
              min={6}
              max={10}
              defaultValue={unitSettings?.defaultPlannedSessions ?? 8}
              onChange={(e) =>
                setSettings({ defaultPlannedSessions: Number(e.target.value) })
              }
            />
          </div>
          <Button onClick={() => saveSettings.mutate()}>Guardar parámetros</Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmDeactivate}
        title="Desactivar tratamiento"
        description={`¿Confirma que desea desactivar "${confirmDeactivate?.name}"? Ya no aparecerá en el registro de sesiones.`}
        confirmLabel="Desactivar"
        variant="destructive"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmDeactivate(null)}
      />
    </div>
  );
}
