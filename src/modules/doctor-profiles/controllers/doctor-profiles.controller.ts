import {
  Controller,
  Get,
  Post,
  Body,
  Query,
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CurrentUser,
  Public,
  RequirePermissions,
} from '../../../common/decorators';
import { ApiResponse } from '../../../common/classes';
import type {
  ApiResponseBody,
  DataKeyWrapper,
} from '../../../common/interfaces';
import { DOCTOR_PROFILE_SERVICE_TOKEN } from '../../../common/constants';
import type { DoctorProfileEntity } from '../entities';
import type { DoctorsQuery, IDoctorProfileService } from '../interfaces';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import { UpdateDoctorProfileDto } from '../dto/update-doctor-profile.dto';
import { UpdateDoctorStatusDto } from '../dto/update-doctor-status.dto';
import { GetDoctorsQueryDto } from '../dto/get-doctors-query.dto';
import {
  HospitalDoctorListItemDto,
  HospitalDoctorsPaginatedResponseDto,
} from '../dto/hospital-doctors-response.dto';

@ApiTags('doctor-profiles')
@Controller('doctor-profiles')
export class DoctorProfilesController {
  constructor(
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get doctors (public)',
    description:
      'Returns a paginated list of doctors. Optionally filter by hospitalId query param.',
  })
  @ApiOkResponse({ type: HospitalDoctorsPaginatedResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async getDoctors(
    @Query() query: GetDoctorsQueryDto,
  ): Promise<DataKeyWrapper<'doctors'>> {
    const options: DoctorsQuery = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      specialization: query.specialization,
      designation: query.designation,
      sortBy: query.sortBy ?? 'fullName',
      sortOrder: query.sortOrder ?? 'asc',
      hospitalId: query.hospitalId,
    };

    const result = await this.doctorProfileService.getDoctors(options);

    const items: HospitalDoctorListItemDto[] = result.doctors.map((doctor) => ({
      id: doctor.id,
      fullName: doctor.fullName,
      designation: doctor.designation,
      specialization: doctor.specialization,
      phone: doctor.phone,
      email: doctor.email,
      slug: doctor.slug,
      profilePhotoUrl: doctor.profilePhotoUrl,
    }));

    const totalPages =
      result.limit > 0
        ? Math.max(1, Math.ceil(result.total / result.limit))
        : 1;

    const response: HospitalDoctorsPaginatedResponseDto = {
      items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages,
      },
    };

    return ApiResponse.withDataKey('doctors', response);
  }

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

  @Patch(':doctorProfileId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({
    permissions: [
      'doctor.self.profile.update',
      'hospital.doctor.update',
      'super_admin.manage',
    ],
    requireAll: false,
  })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update doctor profile',
    description:
      'Updates doctor details (fullName, designation, specialization, bio). FullName change updates slug. Authorized for the doctor themselves, their parent hospital, or super admin.',
  })
  @ApiOkResponse({ description: 'Doctor profile updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  async updateProfile(
    @Param('doctorProfileId') doctorProfileId: string,
    @Body() dto: UpdateDoctorProfileDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DataKeyWrapper<'doctor'>> {
    const doctor = await this.doctorProfileService.updateProfile(
      doctorProfileId,
      dto,
      user.sub,
    );
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
