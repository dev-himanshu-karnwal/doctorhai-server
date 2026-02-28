import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser, RequirePermissions } from '../../../common/decorators';
import { ApiResponse } from '../../../common/classes';
import type {
  ApiResponseBody,
  DataKeyWrapper,
} from '../../../common/interfaces';
import { DOCTOR_PROFILE_SERVICE_TOKEN } from '../../../common/constants';
import type { DoctorProfileEntity } from '../entities';
import type { IDoctorProfileService } from '../interfaces';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';

import { Patch, Param } from '@nestjs/common';

@ApiTags('doctor-profiles')
@Controller('doctor-profiles')
export class DoctorProfilesController {
  constructor(
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
  ) {}

  @Post('by-hospital')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({
    permissions: ['hospital.doctor.create', 'super_admin.manage'],
    requireAll: false,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Hospital creates doctor',
    description:
      'Hospital (or a doctor associated with a hospital) creates a doctor account. Hospital context is derived from the current user; createdBy is set from JWT. Same profile info as doctor self-registration; hospital chooses username.',
  })
  @ApiCreatedResponse({ description: 'Created doctor profile' })
  @ApiBadRequestResponse({ description: 'Validation failed or username taken' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async createByHospital(
    @Body() dto: CreateDoctorByHospitalDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DataKeyWrapper<'doctor'>> {
    const doctor: DoctorProfileEntity =
      await this.doctorProfileService.createByHospital(dto, user.sub);
    return ApiResponse.withDataKey('doctor', doctor);
  }

  @Patch(':doctorProfileId/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({
    permissions: [
      'doctor.status.update',
      'hospital.doctor.update',
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
    await this.doctorProfileService.updateStatus({
      ...dto,
      doctorProfileId: doctorProfileId,
      updatedByAccountId: user.sub,
    });
    return ApiResponse.success(null, 'Doctor status updated successfully');
  }
}
