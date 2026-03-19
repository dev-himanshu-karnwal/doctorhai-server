import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Inject,
  UseGuards,
  HttpStatus,
  HttpCode,
  Patch,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse as SwaggerResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CurrentUser,
  Public,
  RequirePermissions,
} from '../../../common/decorators';
import { ApiResponse } from '../../../common/classes';
import type { DataKeyWrapper } from '../../../common/interfaces';
import { DOCTOR_PROFILE_SERVICE_TOKEN } from '../../../common/constants';
import type { DoctorProfileEntity } from '../entities';
import type { DoctorsQuery, IDoctorProfileService } from '../interfaces';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { CreateDoctorByHospitalDto } from '../dto/create-doctor-by-hospital.dto';
import { UpdateDoctorProfileDto } from '../dto/update-doctor-profile.dto';
import { GetDoctorsQueryDto } from '../dto/get-doctors-query.dto';
import {
  DoctorProfileResponseDto,
  PaginatedDoctorsResponseDto,
} from '../dto/doctor-profile-response.dto';

@ApiTags('doctor-profiles')
@Controller('doctor-profiles')
export class DoctorProfilesController {
  constructor(
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
  ) {}

  @Get('stats')
  @Public()
  @ApiOperation({
    summary: 'Get doctor statistics',
    description:
      'Returns total, verified, unverified and available counts for doctors.',
  })
  @ApiOkResponse({ description: 'Statistics retrieved successfully' })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  async getStats(
    @Query('hospitalId') hospitalId?: string,
  ): Promise<DataKeyWrapper<'doctorStats'>> {
    const doctorStats = await this.doctorProfileService.getStats(hospitalId);
    return ApiResponse.withDataKey('doctorStats', doctorStats);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get doctors (public)',
    description:
      'Returns a paginated list of doctors. Optionally filter by hospitalId query param.',
  })
  @SwaggerResponse({
    status: HttpStatus.OK,
    type: DoctorProfileResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async getDoctors(
    @Query() query: GetDoctorsQueryDto,
  ): Promise<PaginatedDoctorsResponseDto> {
    const options: DoctorsQuery = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      specialization: query.specialization,
      designation: query.designation,
      sortBy: query.sortBy ?? 'fullName',
      sortOrder: query.sortOrder ?? 'asc',
      hospitalId: query.hospitalId,
      isVerified: query.isVerified,
      isAvailable: query.isAvailable,
      specialities: query.specialities,
      experience: query.experience,
    };

    return this.doctorProfileService.getDoctors(options);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get doctor by ID' })
  @SwaggerResponse({ status: HttpStatus.OK, type: DoctorProfileResponseDto })
  async getDoctorById(
    @Param('id') id: string,
  ): Promise<DataKeyWrapper<'doctor'>> {
    const doctor = await this.doctorProfileService.getDoctorById(id);
    return ApiResponse.withDataKey('doctor', doctor);
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

  @Post(':doctorProfileId/increment-view-count')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Increment doctor profile view count',
  })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async incrementViewCount(
    @Param('doctorProfileId') doctorProfileId: string,
  ): Promise<DataKeyWrapper<'doctor'>> {
    await this.doctorProfileService.incrementDoctorViewCount(doctorProfileId);
    return ApiResponse.withDataKey('doctor', null);
  }
}
