import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthUser, GlobalRole, JwtPayload, UnitRole } from '@clinica/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.staffUser.findUnique({
      where: { username },
      include: {
        unitAssignments: { include: { unit: true } },
      },
    });

    if (!user?.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const authUser = this.toAuthUser(user);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      clinicId: user.clinicId,
      globalRole: user.globalRole as GlobalRole,
      unitIds: authUser.units.map((u) => u.id),
      unitRoles: Object.fromEntries(
        authUser.units.map((u) => [u.id, u.role]),
      ),
    };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken, user: authUser };
  }

  async refresh(refreshToken: string) {
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: refreshHash },
      include: {
        user: {
          include: { unitAssignments: { include: { unit: true } } },
        },
      },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.user.active) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const authUser = this.toAuthUser(stored.user);
    const payload: JwtPayload = {
      sub: stored.user.id,
      username: stored.user.username,
      clinicId: stored.user.clinicId,
      globalRole: stored.user.globalRole as GlobalRole,
      unitIds: authUser.units.map((u) => u.id),
      unitRoles: Object.fromEntries(authUser.units.map((u) => [u.id, u.role])),
    };

    const accessToken = this.jwt.sign(payload);
    const newRefresh = crypto.randomBytes(48).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { userId: stored.user.id, tokenHash: newHash, expiresAt },
    });

    return { accessToken, refreshToken: newRefresh, user: authUser };
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.staffUser.findUnique({
      where: { id },
      include: { unitAssignments: { include: { unit: true } } },
    });
    if (!user?.active) return null;
    return this.toAuthUser(user);
  }

  private toAuthUser(user: {
    id: string;
    username: string;
    fullName: string;
    clinicId: string;
    globalRole: string;
    unitAssignments: Array<{
      role: string;
      unit: { id: string; code: string; name: string };
    }>;
  }): AuthUser {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      clinicId: user.clinicId,
      globalRole: user.globalRole as GlobalRole,
      units: user.unitAssignments.map((a) => ({
        id: a.unit.id,
        code: a.unit.code,
        name: a.unit.name,
        role: a.role as UnitRole,
      })),
    };
  }
}
