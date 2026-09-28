import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CreateStaffInput,
  UpdateStaffInput,
} from '@clinica/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async list(clinicId: string) {
    return this.prisma.staffUser.findMany({
      where: { clinicId },
      select: {
        id: true,
        username: true,
        fullName: true,
        globalRole: true,
        active: true,
        unitAssignments: {
          include: { unit: { select: { id: true, code: true, name: true } } },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(clinicId: string, input: CreateStaffInput) {
    const existing = await this.prisma.staffUser.findUnique({
      where: { username: input.username },
    });
    if (existing) throw new ConflictException('Usuario ya existe');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.staffUser.create({
      data: {
        clinicId,
        username: input.username,
        passwordHash,
        fullName: input.fullName,
        globalRole: input.globalRole,
      },
    });

    for (const a of input.unitAssignments) {
      await this.prisma.staffUnitRole.create({
        data: { userId: user.id, unitId: a.unitId, role: a.role },
      });
    }

    return this.findOne(clinicId, user.id);
  }

  async update(clinicId: string, id: string, input: UpdateStaffInput) {
    await this.findOne(clinicId, id);

    const data: Record<string, unknown> = {};
    if (input.fullName) data.fullName = input.fullName;
    if (input.active !== undefined) data.active = input.active;
    if (input.globalRole) data.globalRole = input.globalRole;
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, 10);

    await this.prisma.staffUser.update({ where: { id }, data });

    if (input.unitAssignments) {
      await this.prisma.staffUnitRole.deleteMany({ where: { userId: id } });
      for (const a of input.unitAssignments) {
        await this.prisma.staffUnitRole.create({
          data: { userId: id, unitId: a.unitId, role: a.role },
        });
      }
    }

    return this.findOne(clinicId, id);
  }

  async findOne(clinicId: string, id: string) {
    const user = await this.prisma.staffUser.findFirst({
      where: { id, clinicId },
      select: {
        id: true,
        username: true,
        fullName: true,
        globalRole: true,
        active: true,
        unitAssignments: {
          include: { unit: { select: { id: true, code: true, name: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
