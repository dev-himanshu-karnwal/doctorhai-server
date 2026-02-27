import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
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
import { ParseObjectIdPipe } from '../../../common/pipes';
import type {
  HospitalDoctorsQuery,
  IDoctorProfileService,
} from '../../doctor-profiles/interfaces';
import { GetHospitalDoctorsQueryDto } from '../../doctor-profiles/dto/get-hospital-doctors-query.dto';
import {
  HospitalDoctorListItemDto,
  HospitalDoctorsPaginatedResponseDto,
} from '../../doctor-profiles/dto/hospital-doctors-response.dto';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorProfileService: IDoctorProfileService,
  ) {}

  @Get(':hospitalId/doctors')
  @Public()
  @ApiOperation({
    summary: 'Get all doctors in a hospital (public)',
    description:
      'Returns a paginated list of doctors belonging to the given hospital. Supports filtering, sorting and searching.',
  })
  @ApiOkResponse({ type: HospitalDoctorsPaginatedResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async getHospitalDoctors(
    @Param('hospitalId', ParseObjectIdPipe) hospitalId: string,
    @Query() query: GetHospitalDoctorsQueryDto,
  ): Promise<DataKeyWrapper<'doctors'>> {
    const options: HospitalDoctorsQuery = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      specialization: query.specialization,
      designation: query.designation,
      sortBy: query.sortBy ?? 'fullName',
      sortOrder: query.sortOrder ?? 'asc',
    };

    const result = await this.doctorProfileService.getDoctorsForHospital(
      hospitalId,
      options,
    );

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
