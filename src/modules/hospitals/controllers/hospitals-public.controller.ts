import { Controller, Get, Inject, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { HOSPITAL_SERVICE_TOKEN } from '../../../common/constants';
import { ApiResponse } from '../../../common/classes';
import type { DataKeyWrapper } from '../../../common/interfaces';
import { Public } from '../../../common/decorators';

import type { IHospitalService, HospitalsQuery } from '../interfaces';
import { GetHospitalsQueryDto } from '../dto/hospital-query.dto';
import {
  HospitalListItemDto,
  HospitalPaginatedResponseDto,
} from '../dto/hospital.response';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalPublicController {
  constructor(
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
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

    const result = await this.hospitalService.getHospitals(options);

    const items: HospitalListItemDto[] = result.hospitals.map((hospital) => ({
      id: hospital.id,
      accountId: hospital.accountId,
      addressId: hospital.addressId,
      name: hospital.name,
      slug: hospital.slug,
      phone: hospital.phone,
      email: hospital.email,
      coverPhotoUrl: hospital.coverPhotoUrl,
      isActive: hospital.isActive,
      createdAt: hospital.createdAt,
      updatedAt: hospital.updatedAt,
    }));

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
}
