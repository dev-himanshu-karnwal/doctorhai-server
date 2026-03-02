import {
  Controller,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser, RequirePermissions } from '../../../common/decorators';
import { ApiResponse } from '../../../common/classes';
import type { ApiResponseBody } from '../../../common/interfaces';
import { DOCTOR_STATUS_SERVICE_TOKEN } from '../../../common/constants';
import type { IDoctorStatusService } from '../interfaces/doctor-status-service.interface';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

@ApiTags('doctor-statuses')
@Controller('doctor-statuses')
export class DoctorStatusesController {
  constructor(
    @Inject(DOCTOR_STATUS_SERVICE_TOKEN)
    private readonly doctorStatusService: IDoctorStatusService,
  ) {}

  @Patch(':doctorProfileId/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({
    permissions: [
      'doctor.self.status.update',
      'hospital.doctor.status.update',
      'super_admin.manage',
    ],
    requireAll: false,
  })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update doctor availability status',
    description:
      'Updates the availability status of a doctor. Authorized for the doctor themselves, their parent hospital, or super admin.',
  })
  @ApiOkResponse({ description: 'Status updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async updateStatus(
    @Param('doctorProfileId') doctorProfileId: string,
    @Body() dto: UpdateDoctorStatusDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponseBody<null>> {
    await this.doctorStatusService.updateStatus({
      ...dto,
      doctorProfileId: doctorProfileId,
      updatedByAccountId: user.sub,
    });
    return ApiResponse.success(null, 'Doctor status updated successfully');
  }
}
