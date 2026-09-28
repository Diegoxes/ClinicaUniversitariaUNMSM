import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ClinicService {
  constructor(private prisma: PrismaService) {}

  async getUnitsForClinic(clinicId: string) {
    return this.prisma.unit.findMany({
      where: { clinicId, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, moduleType: true },
    });
  }
}
