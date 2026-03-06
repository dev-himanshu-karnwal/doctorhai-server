import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityStatus } from '../../doctor-statuses/enums/availability-status.enum';

export class DoctorStatusResponseDto {
  @ApiProperty({ example: 'available', enum: AvailabilityStatus })
  status: AvailabilityStatus;

  @ApiPropertyOptional({ example: '2026-03-05T10:00:00Z' })
  expectedAt: Date | null;

  @ApiPropertyOptional({ example: 'Back in 1 hour' })
  expectedAtNote: string | null;

  @ApiProperty({ example: '2026-03-05T08:00:00Z' })
  updatedAt: Date;
}

export class DoctorProfileResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Dr. John Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: 'Senior Surgeon' })
  designation: string | null;

  @ApiPropertyOptional({ example: 'Cardiology' })
  specialization: string | null;

  @ApiPropertyOptional({ example: 'Experienced cardiologist with 15 years...' })
  bio: string | null;

  @ApiProperty({ example: '+1234567890' })
  phone: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'dr-john-doe' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  profilePhotoUrl: string | null;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether the doctor has experience. Null until explicitly set.',
  })
  hasExperience: string | null;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  hospitalId: string | null;

  @ApiPropertyOptional({ type: DoctorStatusResponseDto })
  status?: DoctorStatusResponseDto | null;
}

export class PaginatedDoctorsResponseDto {
  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  paginatedmetadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({ type: [DoctorProfileResponseDto] })
  doctors: DoctorProfileResponseDto[];
}
