import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GlobalRole, AuthUser } from '@clinica/shared';

@Injectable()
export class UnitAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    const unitId = request.params.unitId as string | undefined;

    if (!user) return false;
    if (user.globalRole === GlobalRole.ADMIN) return true;
    if (!unitId) return true;

    const hasAccess = user.units.some((u) => u.id === unitId);
    if (!hasAccess) {
      throw new ForbiddenException('Sin acceso a esta unidad');
    }
    return true;
  }
}
