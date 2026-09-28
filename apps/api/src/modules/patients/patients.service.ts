import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreatePatientInput,
  UpdatePatientInput,
} from '@clinica/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async search(clinicId: string, search?: string) {
    const patients = await this.prisma.patient.findMany({
      where: {
        clinicId,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      take: 50,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const results = await Promise.all(
      patients.map(async (p) => {
        const lastVisit = await this.prisma.unitVisit.findFirst({
          where: { patientId: p.id },
          orderBy: { visitDate: 'desc' },
          select: { visitDate: true },
        });
        return {
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          age: p.age,
          district: p.district,
          tariffType: p.tariffType,
          lastVisitDate: lastVisit?.visitDate.toISOString() ?? null,
        };
      }),
    );

    return results;
  }

  async create(clinicId: string, input: CreatePatientInput) {
    return this.prisma.patient.create({
      data: { clinicId, ...input },
    });
  }

  async findOne(clinicId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, clinicId },
    });
    if (!patient) throw new NotFoundException('Paciente no encontrado');
    return patient;
  }

  async update(clinicId: string, id: string, input: UpdatePatientInput) {
    await this.findOne(clinicId, id);
    return this.prisma.patient.update({ where: { id }, data: input });
  }

  async getSummary(clinicId: string, patientId: string, unitId?: string) {
    const patient = await this.findOne(clinicId, patientId);

    const activePlan = await this.prisma.rehabPlan.findFirst({
      where: {
        patientId,
        clinicId,
        status: 'IN_PROGRESS',
        ...(unitId ? { unitId } : {}),
      },
      include: { _count: { select: { sessions: true } } },
    });

    const lastSession = await this.prisma.rehabSession.findFirst({
      where: { plan: { patientId, clinicId } },
      orderBy: { sessionDate: 'desc' },
      include: {
        treatments: {
          include: { catalogItem: true },
        },
      },
    });

    return {
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        age: patient.age,
        district: patient.district,
        phone: patient.phone,
        tariffType: patient.tariffType,
      },
      activePlan: activePlan
        ? {
            id: activePlan.id,
            plannedSessions: activePlan.plannedSessions,
            completedSessions: activePlan._count.sessions,
            status: activePlan.status,
          }
        : null,
      lastSession: lastSession
        ? {
            date: lastSession.sessionDate.toISOString(),
            painIn: lastSession.painIn,
            painOut: lastSession.painOut,
            treatments: lastSession.treatments.map(
              (t) => t.catalogItem?.name ?? t.otherText ?? 'Otro',
            ),
          }
        : null,
    };
  }

  async getTimeline(clinicId: string, patientId: string) {
    await this.findOne(clinicId, patientId);

    const sessions = await this.prisma.rehabSession.findMany({
      where: { plan: { patientId, clinicId } },
      orderBy: { sessionDate: 'desc' },
      include: {
        plan: { select: { id: true, status: true, plannedSessions: true } },
        professional: { select: { fullName: true } },
        treatments: { include: { catalogItem: true } },
      },
    });

    const plans = await this.prisma.rehabPlan.findMany({
      where: { patientId, clinicId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sessions: true } } },
    });

    const visits = await this.prisma.unitVisit.findMany({
      where: { patientId, clinicId },
      orderBy: { visitDate: 'desc' },
    });

    return { visits, plans, sessions };
  }
}
