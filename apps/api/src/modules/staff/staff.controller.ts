import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AuthUser,
  GlobalRole,
  createStaffSchema,
  updateStaffSchema,
} from '@clinica/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StaffService } from './staff.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.ADMIN)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.staffService.list(user.clinicId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = createStaffSchema.parse(body);
    return this.staffService.create(user.clinicId, input);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const input = updateStaffSchema.parse(body);
    return this.staffService.update(user.clinicId, id, input);
  }
}
