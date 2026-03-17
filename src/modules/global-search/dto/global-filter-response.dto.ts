import { ApiProperty } from '@nestjs/swagger';
import { DoctorProfileResponseDto } from '../../doctor-profiles/dto/doctor-profile-response.dto';
import { HospitalListItemDto } from '../../hospitals/dto/hospital.response';

export class GlobalPaginationMetadata {
  @ApiProperty({ description: 'Total number of doctors found' })
  totalDoctors: number;

  @ApiProperty({ description: 'Total number of hospitals found' })
  totalHospitals: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages for doctors' })
  totalPagesDoctors: number;

  @ApiProperty({ description: 'Total pages for hospitals' })
  totalPagesHospitals: number;
}

export class GlobalFilterDataDto {
  @ApiProperty({
    type: [DoctorProfileResponseDto],
    description: 'List of doctors',
  })
  doctor: DoctorProfileResponseDto[];

  @ApiProperty({
    type: [HospitalListItemDto],
    description: 'List of hospitals',
  })
  hospital: HospitalListItemDto[];

  @ApiProperty({
    type: GlobalPaginationMetadata,
    description: 'Pagination information',
  })
  pagination: GlobalPaginationMetadata;
}

export class GlobalFilterResponseDto {
  @ApiProperty({ description: 'Response status', example: 'success' })
  status: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Global data fetched successfully',
  })
  message: string;

  @ApiProperty({ type: GlobalFilterDataDto, description: 'Response data' })
  data: GlobalFilterDataDto;
}
