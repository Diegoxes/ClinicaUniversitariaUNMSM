import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthUser } from '@clinica/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ClinicService } from './clinic.service';

@Controller('clinic')
@UseGuards(JwtAuthGuard)
export class ClinicController {
  constructor(private clinicService: ClinicService) {}

  @Get('units')
  getUnits(@CurrentUser() user: AuthUser) {
    return this.clinicService.getUnitsForClinic(user.clinicId);
  }
}
