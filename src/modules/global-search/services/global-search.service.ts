import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  DOCTOR_PROFILE_SERVICE_TOKEN,
  HOSPITAL_SERVICE_TOKEN,
} from '../../../common/constants';
import { ApiResponseStatus } from '../../../common/enums';
import type { IDoctorProfileService } from '../../doctor-profiles/interfaces';
import type { IHospitalService } from '../../hospitals/interfaces';
import { IGlobalSearchService } from '../interfaces/global-service.interface';
import { GlobalFilterQueryDto } from '../dto/global-filter-query.dto';
import { GlobalFilterResponseDto } from '../dto/global-filter-response.dto';
import { HospitalListItemDto } from '../../hospitals/dto/hospital.response';
import { HospitalEntity } from '../../hospitals/entities';

@Injectable()
export class GlobalSearchService implements IGlobalSearchService {
  private readonly logger = new Logger(GlobalSearchService.name);

  constructor(
    @Inject(DOCTOR_PROFILE_SERVICE_TOKEN)
    private readonly doctorService: IDoctorProfileService,
    @Inject(HOSPITAL_SERVICE_TOKEN)
    private readonly hospitalService: IHospitalService,
  ) {}

  async filter(query: GlobalFilterQueryDto): Promise<GlobalFilterResponseDto> {
    this.logger.debug(`Global filter with query: ${JSON.stringify(query)}`);

    const {
      search,
      city,
      state,
      speciality,
      designation,
      hasexperience,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Map sorting fields
    const docSortBy =
      sortBy === 'name'
        ? 'fullName'
        : (sortBy as 'fullName' | 'createdAt' | 'public_view_count');
    const hospSortBy =
      sortBy === 'fullName'
        ? 'name'
        : (sortBy as 'name' | 'createdAt' | 'public_view_count');

    // 1. Fetch Doctors
    const doctorResults = await this.doctorService.getDoctors({
      page,
      limit,
      search,
      specialization: speciality,
      designation,
      experience: hasexperience ? [hasexperience] : undefined,
      isAvailable: status === 'available' ? true : undefined,
      city,
      state,
      sortBy: ['fullName', 'createdAt', 'public_view_count'].includes(docSortBy)
        ? docSortBy
        : 'createdAt',
      sortOrder,
    });

    // 2. Fetch Hospitals
    const hospitalResults = await this.hospitalService.getHospitals({
      page,
      limit,
      search,
      specialities: speciality ? [speciality] : undefined,
      city,
      state,
      experience: hasexperience ? [hasexperience] : undefined,
      sortBy: ['name', 'createdAt', 'public_view_count'].includes(hospSortBy)
        ? hospSortBy
        : 'createdAt',
      sortOrder,
    });

    // 3. If any doctor matches, fetch their hospitals
    const matchedDoctorHospitalIds = doctorResults.doctors
      .map((d) => d.hospitalId)
      .filter((id): id is string => !!id);

    const uniqueHospitalIds = [...new Set(matchedDoctorHospitalIds)];

    const existingHospitalIds = new Set(
      hospitalResults.hospitals.map((h) => h.id),
    );
    const missingHospitalIds = uniqueHospitalIds.filter(
      (id) => !existingHospitalIds.has(id),
    );

    let additionalHospitals: HospitalEntity[] = [];
    if (missingHospitalIds.length > 0) {
      const fetches = missingHospitalIds.map((id) =>
        this.hospitalService.findById(id),
      );
      const results = await Promise.all(fetches);
      additionalHospitals = results.filter((h): h is HospitalEntity => !!h);
    }

    const allHospitals: HospitalEntity[] = [
      ...hospitalResults.hospitals,
      ...additionalHospitals,
    ];

    // Note: totalPages calculations
    const totalPagesDoctors = Math.ceil(
      doctorResults.paginatedmetadata.total / limit,
    );
    const totalPagesHospitals = Math.ceil(
      (hospitalResults.total + additionalHospitals.length) / limit,
    );

    return {
      status: ApiResponseStatus.SUCCESS,
      message: 'Global data fetched successfully',
      data: {
        doctor: doctorResults.doctors,
        hospital: allHospitals.map((h) => this.mapToHospitalListItem(h)),
        pagination: {
          totalDoctors: doctorResults.paginatedmetadata.total,
          totalHospitals: hospitalResults.total + additionalHospitals.length,
          page,
          limit,
          totalPagesDoctors,
          totalPagesHospitals,
        },
      },
    };
  }

  private mapToHospitalListItem(hospital: HospitalEntity): HospitalListItemDto {
    return {
      id: hospital.id,
      accountId: hospital.accountId,
      addressId: hospital.addressId,
      name: hospital.name,
      slug: hospital.slug,
      coverPhotoUrl: hospital.coverPhotoUrl,
      isActive: hospital.isActive,
      isVerified: hospital.isVerified,
      location: hospital.location,
      type: hospital.type,
      specialist: hospital.facilities || [],
      public_view_count: hospital.public_view_count || 0,
    };
  }
}
