import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PlanClosureReason,
  ClosePlanInput,
  CreatePlanInput,
  CreateSessionInput,
  CreateVisitInput,
  QueueEntryStatus,
} from '@clinica/shared';
import { RehabPlanStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PhysioService {
  constructor(private prisma: PrismaService) {}

  private async assertUnit(clinicId: string, unitId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, clinicId, active: true },
    });
    if (!unit) throw new NotFoundException('Unidad no encontrada');
    return unit;
  }

  async createVisit(
    clinicId: string,
    unitId: string,
    input: CreateVisitInput,
  ) {
    await this.assertUnit(clinicId, unitId);
    const patient = await this.prisma.patient.findFirst({
      where: { id: input.patientId, clinicId },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');

    return this.prisma.unitVisit.create({
      data: {
        clinicId,
        unitId,
        patientId: input.patientId,
        intakePath: input.intakePath,
        diagnosis: input.diagnosis,
        visitType: input.visitType,
        referralReason: input.referralReason,
        referralInstructions: input.referralInstructions,
        cashTicket: input.cashTicket,
      },
    });
  }

  async listPlans(clinicId: string, unitId: string, patientId?: string) {
    await this.assertUnit(clinicId, unitId);
    return this.prisma.rehabPlan.findMany({
      where: {
        clinicId,
        unitId,
        ...(patientId ? { patientId } : {}),
      },
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(
    clinicId: string,
    unitId: string,
    input: CreatePlanInput,
  ) {
    await this.assertUnit(clinicId, unitId);

    const active = await this.prisma.rehabPlan.findFirst({
      where: {
        clinicId,
        unitId,
        patientId: input.patientId,
        status: RehabPlanStatus.IN_PROGRESS,
      },
    });
    if (active) {
      throw new BadRequestException(
        'El paciente ya tiene un plan en curso. Ciérrelo antes de crear otro.',
      );
    }

    return this.prisma.rehabPlan.create({
      data: {
        clinicId,
        unitId,
        patientId: input.patientId,
        visitId: input.visitId,
        plannedSessions: input.plannedSessions,
        origin: input.origin,
      },
      include: { _count: { select: { sessions: true } } },
    });
  }

  async closePlan(
    clinicId: string,
    unitId: string,
    planId: string,
    input: ClosePlanInput,
  ) {
    const plan = await this.prisma.rehabPlan.findFirst({
      where: { id: planId, clinicId, unitId },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    const status =
      input.reason === PlanClosureReason.DISCHARGE
        ? RehabPlanStatus.DISCHARGE
        : RehabPlanStatus.MEDICAL_REEVAL;

    return this.prisma.rehabPlan.update({
      where: { id: planId },
      data: {
        status,
        closureReason: input.reason,
        closureNote: input.note,
        closedAt: new Date(),
      },
    });
  }

  async createSession(
    clinicId: string,
    unitId: string,
    planId: string,
    professionalId: string,
    input: CreateSessionInput,
  ) {
    const plan = await this.prisma.rehabPlan.findFirst({
      where: { id: planId, clinicId, unitId, status: RehabPlanStatus.IN_PROGRESS },
      include: { _count: { select: { sessions: true } } },
    });
    if (!plan) throw new NotFoundException('Plan activo no encontrado');

    const hasPain =
      input.painIn !== null &&
      input.painIn !== undefined &&
      input.painOut !== null &&
      input.painOut !== undefined;
    const hasTreatments = input.treatmentIds.length > 0 || !!input.otherTreatment;
    if (!hasPain && !input.painOmissionReason) {
      throw new BadRequestException('Registre dolor o motivo de omisión');
    }
    if (!hasTreatments) {
      throw new BadRequestException('Seleccione al menos un tratamiento');
    }

    const session = await this.prisma.rehabSession.create({
      data: {
        clinicId,
        unitId,
        planId,
        visitId: input.visitId,
        professionalId,
        painIn: input.painIn,
        painOut: input.painOut,
        painOmissionReason: input.painOmissionReason,
        note: input.note,
        treatments: {
          create: [
            ...input.treatmentIds.map((catalogItemId) => ({ catalogItemId })),
            ...(input.otherTreatment
              ? [{ otherText: input.otherTreatment }]
              : []),
          ],
        },
      },
      include: {
        treatments: { include: { catalogItem: true } },
        professional: { select: { fullName: true } },
      },
    });

    const completed = plan._count.sessions + 1;
    if (completed >= plan.plannedSessions) {
      await this.prisma.rehabPlan.update({
        where: { id: planId },
        data: { status: RehabPlanStatus.COMPLETED },
      });
    }

    return session;
  }

  async getQueue(clinicId: string, unitId: string, dateStr: string) {
    await this.assertUnit(clinicId, unitId);
    const queueDate = new Date(dateStr + 'T00:00:00.000Z');

    return this.prisma.dayQueueEntry.findMany({
      where: { clinicId, unitId, queueDate },
      orderBy: { position: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            district: true,
          },
        },
      },
    });
  }

  async addToQueue(clinicId: string, unitId: string, patientId: string, dateStr?: string) {
    await this.assertUnit(clinicId, unitId);
    const queueDate = new Date((dateStr ?? new Date().toISOString().slice(0, 10)) + 'T00:00:00.000Z');

    const existing = await this.prisma.dayQueueEntry.findUnique({
      where: { unitId_queueDate_patientId: { unitId, queueDate, patientId } },
    });
    if (existing) return existing;

    const maxPos = await this.prisma.dayQueueEntry.aggregate({
      where: { unitId, queueDate },
      _max: { position: true },
    });

    return this.prisma.dayQueueEntry.create({
      data: {
        clinicId,
        unitId,
        patientId,
        queueDate,
        position: (maxPos._max.position ?? 0) + 1,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, age: true, district: true },
        },
      },
    });
  }

  async reorderQueue(
    clinicId: string,
    unitId: string,
    dateStr: string,
    entryIds: string[],
  ) {
    await this.assertUnit(clinicId, unitId);
    const queueDate = new Date(dateStr + 'T00:00:00.000Z');

    for (let i = 0; i < entryIds.length; i++) {
      await this.prisma.dayQueueEntry.updateMany({
        where: { id: entryIds[i], clinicId, unitId, queueDate },
        data: { position: i + 1 },
      });
    }

    return this.getQueue(clinicId, unitId, dateStr);
  }

  async updateQueueStatus(
    clinicId: string,
    unitId: string,
    entryId: string,
    status: QueueEntryStatus,
  ) {
    const entry = await this.prisma.dayQueueEntry.findFirst({
      where: { id: entryId, clinicId, unitId },
    });
    if (!entry) throw new NotFoundException('Entrada de cola no encontrada');

    return this.prisma.dayQueueEntry.update({
      where: { id: entryId },
      data: { status },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, age: true, district: true },
        },
      },
    });
  }

  async listCatalog(clinicId: string, unitId: string, includeInactive = false) {
    await this.assertUnit(clinicId, unitId);
    return this.prisma.treatmentCatalogItem.findMany({
      where: { unitId, ...(includeInactive ? {} : { active: true }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCatalogItem(
    clinicId: string,
    unitId: string,
    name: string,
    sortOrder: number,
  ) {
    await this.assertUnit(clinicId, unitId);
    return this.prisma.treatmentCatalogItem.create({
      data: { unitId, name, sortOrder },
    });
  }

  async updateCatalogItem(
    clinicId: string,
    unitId: string,
    itemId: string,
    data: { name?: string; sortOrder?: number; active?: boolean },
  ) {
    await this.assertUnit(clinicId, unitId);
    const item = await this.prisma.treatmentCatalogItem.findFirst({
      where: { id: itemId, unitId },
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    return this.prisma.treatmentCatalogItem.update({ where: { id: itemId }, data });
  }

  async getSettings(clinicId: string, unitId: string) {
    await this.assertUnit(clinicId, unitId);
    let settings = await this.prisma.unitSetting.findUnique({ where: { unitId } });
    if (!settings) {
      settings = await this.prisma.unitSetting.create({ data: { unitId } });
    }
    return settings;
  }

  async updateSettings(
    clinicId: string,
    unitId: string,
    data: {
      defaultPlannedSessions?: number;
      painScaleHelpText?: string;
      intakeHelpText?: string;
    },
  ) {
    await this.assertUnit(clinicId, unitId);
    return this.prisma.unitSetting.upsert({
      where: { unitId },
      create: { unitId, ...data },
      update: data,
    });
  }
}
