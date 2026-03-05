import {
  Controller,
  Get,
  Inject,
  Query,
  forwardRef,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  HOSPITAL_SERVICE_TOKEN,
  DOCTOR_PROFILE_SERVICE_TOKEN,
} from '../../../common/constants';
import { ApiResponse } from '../../../common/classes';
import type { DataKeyWrapper } from '../../../common/interfaces';
import { Public } from '../../../common/decorators';
import type {
  IHospitalService,
  HospitalsQuery,
  PaginatedHospitals,
} from '../interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { HospitalEntity } from '../entities';
import { GetHospitalsQueryDto, UpdateHospitalDto } from '../dto';
import {
  HospitalListItemDto,
  HospitalPaginatedResponseDto,
} from '../dto/hospital.response';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @Inject(forwardRef(() => DOCTOR_PROFILE_SERVICE_TOKEN))
    private readonly doctorProfileService: IDoctorProfileService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get Hospitals (public)',
    description:
      'Returns a paginated list of hospitals with optional filters and sorting.',
  })
  @ApiOkResponse({ type: HospitalPaginatedResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async getHospitals(
    @Query() query: GetHospitalsQueryDto,
  ): Promise<DataKeyWrapper<'hospitals'>> {
    const options: HospitalsQuery = {
      page: query.page,
      limit: query.limit,
      search: query.search,
      name: query.name,
      isActive: query.isActive,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    };

    const result: PaginatedHospitals =
      await this.hospitalService.getHospitals(options);

    const hospitalIds = result.hospitals.map((h) => h.id);
    const specialistsMap =
      await this.doctorProfileService.getSpecializationsByHospitalIds(
        hospitalIds,
      );

    const items: HospitalListItemDto[] = result.hospitals.map(
      (hospital: HospitalEntity) => ({
        id: hospital.id,
        accountId: hospital.accountId,
        addressId: hospital.addressId,
        name: hospital.name,
        slug: hospital.slug,
        phone: hospital.phone,
        email: hospital.email,
        coverPhotoUrl: hospital.coverPhotoUrl,
        isActive: hospital.isActive,
        location: hospital.location,
        type: hospital.type,
        specialist: specialistsMap.get(hospital.id) ?? [],
        facilities: hospital.facilities,
        createdAt: hospital.createdAt,
        updatedAt: hospital.updatedAt,
      }),
    );

    const totalPages =
      result.limit > 0
        ? Math.max(1, Math.ceil(result.total / result.limit))
        : 1;

    const response: HospitalPaginatedResponseDto = {
      items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages,
      },
    };

    return ApiResponse.withDataKey('hospitals', response);
  }

  @Patch(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update hospital by ID',
    description:
      'Updates hospital details by ID. Name change updates slug. (Public for testing)',
  })
  @ApiOkResponse({ description: 'Hospital updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHospitalDto,
  ): Promise<DataKeyWrapper<'hospital'>> {
    const hospital = await this.hospitalService.update(id, dto);
    return ApiResponse.withDataKey('hospital', hospital);
  }
}
