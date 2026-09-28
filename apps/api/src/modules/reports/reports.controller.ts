import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  AuthUser,
  ExportFormat,
  PatientVisitType,
  UserTariffType,
} from '@clinica/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UnitAccessGuard } from '../../common/guards/unit-access.guard';
import { ReportsService } from './reports.service';

@Controller('units/:unitId/reports')
@UseGuards(JwtAuthGuard, UnitAccessGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  daily(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Query('date') date?: string,
  ) {
    const dateStr = date ?? new Date().toISOString().slice(0, 10);
    return this.reportsService.dailyReport(user.clinicId, unitId, dateStr);
  }

  @Get('monthly')
  monthly(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('tariffType') tariffType?: UserTariffType,
    @Query('visitType') visitType?: PatientVisitType,
  ) {
    return this.reportsService.monthlyReport(
      user.clinicId,
      unitId,
      parseInt(year, 10),
      parseInt(month, 10),
      { tariffType, visitType },
    );
  }

  @Get('export')
  async exportReport(
    @CurrentUser() user: AuthUser,
    @Param('unitId') unitId: string,
    @Query('format') format: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('tariffType') tariffType?: UserTariffType,
    @Query('visitType') visitType?: PatientVisitType,
    @Res() res?: Response,
  ) {
    const exportFormat =
      format === 'xlsx'
        ? ExportFormat.XLSX
        : format === 'pdf'
          ? ExportFormat.PDF
          : ExportFormat.CSV;

    const result = await this.reportsService.exportReport(
      user.clinicId,
      unitId,
      exportFormat,
      from,
      to,
      { tariffType, visitType },
    );

    res!.setHeader('Content-Type', result.contentType);
    res!.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res!.send(result.buffer);
  }
}
