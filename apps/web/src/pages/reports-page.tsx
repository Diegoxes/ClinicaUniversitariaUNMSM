import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiDownload, apiFetch } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface ReportRow {
  patientName: string;
  tariffType: string;
  visitType: string;
  diagnosis: string;
  treatments: string;
  district: string;
  age: number;
  sessionDate: string;
}

function ReportTable({ rows }: { rows: ReportRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">No hay atenciones en este período.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-pearl-300 text-marcos-red">
            <th className="py-2 pr-3 font-medium">Fecha</th>
            <th className="py-2 pr-3 font-medium">Paciente</th>
            <th className="py-2 pr-3 font-medium">Edad</th>
            <th className="py-2 pr-3 font-medium">Distrito</th>
            <th className="py-2 pr-3 font-medium">Diagnóstico</th>
            <th className="py-2 font-medium">Tratamientos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.sessionDate}-${row.patientName}-${i}`} className="border-b border-pearl-200 last:border-0 text-ink">
              <td className="py-2 pr-3 whitespace-nowrap">
                {new Date(row.sessionDate).toLocaleDateString('es-PE')}
              </td>
              <td className="py-2 pr-3">{row.patientName}</td>
              <td className="py-2 pr-3">{row.age}</td>
              <td className="py-2 pr-3">{row.district}</td>
              <td className="py-2 pr-3">{row.diagnosis}</td>
              <td className="py-2">{row.treatments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsPage() {
  const { unitId } = useAuth();
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [dailyDate, setDailyDate] = useState(today);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [exportFrom, setExportFrom] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
  );
  const [exportTo, setExportTo] = useState(today);

  const { data: dailyReport } = useQuery({
    queryKey: ['report-daily', unitId, dailyDate],
    queryFn: () =>
      apiFetch<{ total: number; rows: ReportRow[] }>(
        `/units/${unitId}/reports/daily?date=${dailyDate}`,
      ),
    enabled: !!unitId,
  });

  const { data: monthlyReport } = useQuery({
    queryKey: ['report-monthly', unitId, year, month],
    queryFn: () =>
      apiFetch<{ total: number; rows: ReportRow[] }>(
        `/units/${unitId}/reports/monthly?year=${year}&month=${month}`,
      ),
    enabled: !!unitId,
  });

  async function download(format: 'csv' | 'xlsx' | 'pdf') {
    try {
      await apiDownload(
        `/units/${unitId}/reports/export?format=${format}&from=${exportFrom}&to=${exportTo}`,
      );
      toast.success('Descarga iniciada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo exportar el reporte');
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reportes"
        description="Consulte atenciones del día y del mes, y exporte el detalle completo"
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporte del día</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="dailyDate">Fecha</Label>
            <Input
              id="dailyDate"
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
            />
          </div>
          <p className="text-sm">
            Total atenciones: <strong>{dailyReport?.total ?? '…'}</strong>
          </p>
          {dailyReport && <ReportTable rows={dailyReport.rows} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reporte mensual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="month">Mes</Label>
              <Input
                id="month"
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-sm">
            Total del mes: <strong>{monthlyReport?.total ?? '…'}</strong>
          </p>
          {monthlyReport && <ReportTable rows={monthlyReport.rows} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar</CardTitle>
          <p className="text-sm text-ink-muted">
            Use los botones de exportación para descargar el detalle completo en el rango seleccionado.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label htmlFor="exportFrom">Desde</Label>
              <Input
                id="exportFrom"
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="exportTo">Hasta</Label>
              <Input
                id="exportTo"
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => download('csv')}>
              CSV
            </Button>
            <Button variant="outline" onClick={() => download('xlsx')}>
              Excel
            </Button>
            <Button variant="outline" onClick={() => download('pdf')}>
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
