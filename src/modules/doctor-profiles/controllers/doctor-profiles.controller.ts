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
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser, RequirePermissions } from '../../../common/decorators';
import { ApiResponse } from '../../../common/classes';
import type { DataKeyWrapper } from '../../../common/interfaces';
import { DOCTOR_PROFILE_SERVICE_TOKEN } from '../../../common/constants';
import type { DoctorProfileEntity } from '../entities';
import type { IDoctorProfileService } from '../interfaces';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';

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
      'Hospital creates a doctor account. Requires auth and permission hospital.doctor.create or super_admin.manage; createdBy is set from JWT. Same profile info as doctor self-registration; hospital chooses username.',
  })
  @ApiCreatedResponse({ description: 'Created doctor profile' })
  @ApiBadRequestResponse({ description: 'Validation failed or username taken' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async createByHospital(
    @Body() dto: CreateDoctorByHospitalDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DataKeyWrapper<'doctor'>> {
    const doctor = (await this.doctorProfileService.createByHospital(
      dto,
      user.sub,
    )) as DoctorProfileEntity;
    return ApiResponse.withDataKey('doctor', doctor);
  }
}
