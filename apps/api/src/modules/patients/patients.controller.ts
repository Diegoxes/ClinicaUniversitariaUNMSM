import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AuthUser,
  createPatientSchema,
  updatePatientSchema,
} from '@clinica/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  search(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.patientsService.search(user.clinicId, search);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = createPatientSchema.parse(body);
    return this.patientsService.create(user.clinicId, input);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.findOne(user.clinicId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updatePatientSchema.parse(body);
    return this.patientsService.update(user.clinicId, id, input);
  }

  @Get(':id/summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.patientsService.getSummary(user.clinicId, id, unitId);
  }

  @Get(':id/timeline')
  timeline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.getTimeline(user.clinicId, id);
  }
}
