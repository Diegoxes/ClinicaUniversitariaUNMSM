import { Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ExportFormat, UserTariffType, PatientVisitType } from '@clinica/shared';
import { PrismaService } from '../../prisma/prisma.service';

export interface ReportRow {
  patientName: string;
  tariffType: string;
  visitType: string;
  diagnosis: string;
  treatments: string;
  district: string;
  age: number;
  sessionDate: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async assertUnit(clinicId: string, unitId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, clinicId },
    });
    if (!unit) throw new NotFoundException('Unidad no encontrada');
    return unit;
  }

  private async fetchRows(
    clinicId: string,
    unitId: string,
    from: Date,
    to: Date,
    filters?: {
      tariffType?: UserTariffType;
      visitType?: PatientVisitType;
    },
  ): Promise<ReportRow[]> {
    const sessions = await this.prisma.rehabSession.findMany({
      where: {
        clinicId,
        unitId,
        sessionDate: { gte: from, lte: to },
        plan: {
          patient: {
            ...(filters?.tariffType ? { tariffType: filters.tariffType } : {}),
          },
        },
        ...(filters?.visitType
          ? { visit: { visitType: filters.visitType } }
          : {}),
      },
      include: {
        plan: { include: { patient: true } },
        visit: true,
        treatments: { include: { catalogItem: true } },
      },
      orderBy: { sessionDate: 'asc' },
    });

    return sessions.map((s) => ({
      patientName: `${s.plan.patient.lastName}, ${s.plan.patient.firstName}`,
      tariffType: s.plan.patient.tariffType,
      visitType: s.visit?.visitType ?? 'RETURNING',
      diagnosis: s.visit?.diagnosis ?? '-',
      treatments: s.treatments
        .map((t) => t.catalogItem?.name ?? t.otherText ?? '')
        .filter(Boolean)
        .join(', '),
      district: s.plan.patient.district,
      age: s.plan.patient.age,
      sessionDate: s.sessionDate.toISOString().slice(0, 10),
    }));
  }

  async dailyReport(clinicId: string, unitId: string, dateStr: string) {
    await this.assertUnit(clinicId, unitId);
    const from = new Date(dateStr + 'T00:00:00.000Z');
    const to = new Date(dateStr + 'T23:59:59.999Z');
    const rows = await this.fetchRows(clinicId, unitId, from, to);
    return { date: dateStr, total: rows.length, rows };
  }

  async monthlyReport(
    clinicId: string,
    unitId: string,
    year: number,
    month: number,
    filters?: { tariffType?: UserTariffType; visitType?: PatientVisitType },
  ) {
    await this.assertUnit(clinicId, unitId);
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const rows = await this.fetchRows(clinicId, unitId, from, to, filters);
    return { year, month, total: rows.length, rows };
  }

  async exportReport(
    clinicId: string,
    unitId: string,
    format: ExportFormat,
    fromStr: string,
    toStr: string,
    filters?: { tariffType?: UserTariffType; visitType?: PatientVisitType },
  ) {
    const from = new Date(fromStr + 'T00:00:00.000Z');
    const to = new Date(toStr + 'T23:59:59.999Z');
    const rows = await this.fetchRows(clinicId, unitId, from, to, filters);

    if (format === ExportFormat.CSV) {
      const header =
        'Fecha,Paciente,Tipo tarifa,Nuevo/Reincidente,Diagnóstico,Tratamientos,Distrito,Edad\n';
      const body = rows
        .map(
          (r) =>
            `${r.sessionDate},"${r.patientName}",${r.tariffType},${r.visitType},"${r.diagnosis.replace(/"/g, '""')}","${r.treatments.replace(/"/g, '""')}",${r.district},${r.age}`,
        )
        .join('\n');
      return {
        contentType: 'text/csv; charset=utf-8',
        filename: `reporte-${fromStr}-${toStr}.csv`,
        buffer: Buffer.from('\uFEFF' + header + body, 'utf-8'),
      };
    }

    if (format === ExportFormat.XLSX) {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Reporte');
      ws.columns = [
        { header: 'Fecha', key: 'sessionDate', width: 12 },
        { header: 'Paciente', key: 'patientName', width: 30 },
        { header: 'Tipo tarifa', key: 'tariffType', width: 14 },
        { header: 'Nuevo/Reincidente', key: 'visitType', width: 18 },
        { header: 'Diagnóstico', key: 'diagnosis', width: 30 },
        { header: 'Tratamientos', key: 'treatments', width: 30 },
        { header: 'Distrito', key: 'district', width: 16 },
        { header: 'Edad', key: 'age', width: 8 },
      ];
      ws.addRows(rows);
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());
      return {
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `reporte-${fromStr}-${toStr}.xlsx`,
        buffer,
      };
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));

    await new Promise<void>((resolve, reject) => {
      doc.on('end', () => resolve());
      doc.on('error', reject);

      doc.fontSize(14).text('Reporte Fisioterapia — Clínica Universitaria UNMSM');
      doc.fontSize(10).text(`Periodo: ${fromStr} a ${toStr}`);
      doc.moveDown();

      for (const r of rows) {
        doc
          .fontSize(9)
          .text(
            `${r.sessionDate} | ${r.patientName} | ${r.tariffType} | ${r.visitType} | ${r.diagnosis} | ${r.treatments} | ${r.district} | ${r.age}`,
          );
      }

      doc.end();
    });

    return {
      contentType: 'application/pdf',
      filename: `reporte-${fromStr}-${toStr}.pdf`,
      buffer: Buffer.concat(chunks),
    };
  }
}
