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
  ADDRESS_SERVICE_TOKEN,
} from '../../../common/constants';
import { ApiResponse } from '../../../common/classes';
import type { DataKeyWrapper } from '../../../common/interfaces';
import { Public } from '../../../common/decorators';
import { HospitalsQuery, PaginatedHospitals } from '../interfaces';
import type { IHospitalService } from '../interfaces';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import { HospitalEntity } from '../entities';
import { GetHospitalsQueryDto, UpdateHospitalDto } from '../dto';
import {
  HospitalListItemDto,
  HospitalPaginatedResponseDto,
  HospitalDetailDto,
} from '../dto/hospital.response';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IAddressService } from '../../addresses/interfaces';
import { AddressEntity } from '../../addresses/entities';
import { GetHospitalDoctorsQueryDto } from '../../doctor-profiles/dto/get-hospital-doctors-query.dto';

@ApiTags('hospitals')
@Controller('hospitals')
export class HospitalsController {
  constructor(
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
    @Inject(forwardRef(() => DOCTOR_PROFILE_SERVICE_TOKEN))
    private readonly doctorProfileService: IDoctorProfileService,
    @Inject(ADDRESS_SERVICE_TOKEN)
    private readonly addressService: IAddressService,
  ) {}

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get hospital by ID',
    description: 'Returns all hospital data, address, and associated doctors.',
  })
  @ApiOkResponse({ type: HospitalDetailDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async getHospitalById(
    @Param('id') id: string,
    @Query() query: GetHospitalDoctorsQueryDto,
  ): Promise<DataKeyWrapper<'hospital'>> {
    const hospital = await this.hospitalService.findById(id);
    if (!hospital) {
      throw new ResourceNotFoundException('Hospital', id);
    }

    // Fetch address if it exists
    let address: AddressEntity | null = null;
    if (hospital.addressId) {
      try {
        address = await this.addressService.findById(
          hospital.addressId.toString(),
        );
      } catch {
        // Silently fail if address not found or keep it null
      }
    }

    // Fetch doctors associated with this hospital id with pagination and filters
    const doctorsResult = await this.doctorProfileService.getDoctors({
      hospitalId: id,
      page: query.page,
      limit: query.limit,
      search: query.search,
      specialization: query.specialization,
      designation: query.designation,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const response: HospitalDetailDto = {
      id: hospital.id,
      accountId: hospital.accountId.toString(),
      name: hospital.name,
      slug: hospital.slug,
      phone: hospital.phone,
      email: hospital.email,
      coverPhotoUrl: hospital.coverPhotoUrl,
      isActive: hospital.isActive,
      location: hospital.location,
      type: hospital.type,
      timeline: hospital.timeline,
      facilities: hospital.facilities,
      createdAt: hospital.createdAt,
      updatedAt: hospital.updatedAt,
      address: address
        ? {
            id: address.id,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          }
        : null,
      doctors: {
        items: doctorsResult.doctors.map((d) => ({
          id: d.id,
          fullName: d.fullName,
          designation: d.designation,
          specialization: d.specialization,
          bio: d.bio,
          slug: d.slug,
          profilePhotoUrl: d.profilePhotoUrl,
          status: d.status,
          hasExperience: d.hasExperience,
        })),
        meta: doctorsResult.paginatedmetadata,
      },
    };

    return ApiResponse.withDataKey('hospital', response);
  }

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
      isVerified: query.isVerified,
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
