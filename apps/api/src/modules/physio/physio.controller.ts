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
  addToQueueSchema,
  closePlanSchema,
  createPlanSchema,
  createSessionSchema,
  createTreatmentCatalogSchema,
  createVisitSchema,
  reorderQueueSchema,
  updateQueueStatusSchema,
  updateSettingsSchema,
  updateTreatmentCatalogSchema,
} from '@clinica/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UnitAccessGuard } from '../../common/guards/unit-access.guard';
import { PhysioService } from './physio.service';

@Controller('units/:unitId')
@UseGuards(JwtAuthGuard, UnitAccessGuard)
export class PhysioController {
  constructor(private physioService: PhysioService) {}

  @Post('visits')
  createVisit(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: unknown,
  ) {
    const input = createVisitSchema.parse(body);
    return this.physioService.createVisit(user.clinicId, unitId, input);
  }

  @Get('plans')
  listPlans(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.physioService.listPlans(user.clinicId, unitId, patientId);
  }

  @Post('plans')
  createPlan(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: unknown,
  ) {
    const input = createPlanSchema.parse(body);
    return this.physioService.createPlan(user.clinicId, unitId, input);
  }

  @Patch('plans/:planId/close')
  closePlan(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Param('planId') planId: string,
    @Body() body: unknown,
  ) {
    const input = closePlanSchema.parse(body);
    return this.physioService.closePlan(user.clinicId, unitId, planId, input);
  }

  @Post('plans/:planId/sessions')
  createSession(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Param('planId') planId: string,
    @Body() body: unknown,
  ) {
    const input = createSessionSchema.parse(body);
    return this.physioService.createSession(
      user.clinicId,
      unitId,
      planId,
      user.id,
      input,
    );
  }

  @Get('queue')
  getQueue(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Query('date') date?: string,
  ) {
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    return this.physioService.getQueue(user.clinicId, unitId, dateStr);
  }

  @Post('queue')
  addToQueue(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: unknown,
    @Query('date') date?: string,
  ) {
    const input = addToQueueSchema.parse(body);
    return this.physioService.addToQueue(
      user.clinicId,
      unitId,
      input.patientId,
      date,
    );
  }

  @Patch('queue/reorder')
  reorderQueue(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Query('date') date: string,
    @Body() body: unknown,
  ) {
    const input = reorderQueueSchema.parse(body);
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    return this.physioService.reorderQueue(
      user.clinicId,
      unitId,
      dateStr,
      input.entryIds,
    );
  }

  @Patch('queue/:entryId/status')
  updateQueueStatus(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Param('entryId') entryId: string,
    @Body() body: unknown,
  ) {
    const input = updateQueueStatusSchema.parse(body);
    return this.physioService.updateQueueStatus(
      user.clinicId,
      unitId,
      entryId,
      input.status,
    );
  }

  @Get('catalog/treatments')
  listCatalog(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Query('all') all?: string,
  ) {
    return this.physioService.listCatalog(
      user.clinicId,
      unitId,
      all === 'true',
    );
  }

  @Post('catalog/treatments')
  createCatalogItem(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: unknown,
  ) {
    const input = createTreatmentCatalogSchema.parse(body);
    return this.physioService.createCatalogItem(
      user.clinicId,
      unitId,
      input.name,
      input.sortOrder,
    );
  }

  @Patch('catalog/treatments/:itemId')
  updateCatalogItem(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Param('itemId') itemId: string,
    @Body() body: unknown,
  ) {
    const input = updateTreatmentCatalogSchema.parse(body);
    return this.physioService.updateCatalogItem(
      user.clinicId,
      unitId,
      itemId,
      input,
    );
  }

  @Get('settings')
  getSettings(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
  ) {
    return this.physioService.getSettings(user.clinicId, unitId);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Body() body: unknown,
  ) {
    const input = updateSettingsSchema.parse(body);
    return this.physioService.updateSettings(user.clinicId, unitId, input);
  }
}
