import { Controller, Get, Inject, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DOCTOR_PROFILE_SERVICE_TOKEN } from '../../../common/constants';
import { ApiResponse } from '../../../common/classes';
import type { DataKeyWrapper } from '../../../common/interfaces';
import { Public } from '../../../common/decorators';
import type { DoctorsQuery, IDoctorProfileService } from '../interfaces';
import { GetDoctorsQueryDto } from '../dto/get-doctors-query.dto';
import {
  HospitalDoctorListItemDto,
  HospitalDoctorsPaginatedResponseDto,
} from '../dto/hospital-doctors-response.dto';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsPublicController {
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
}
