import { ApiProperty } from '@nestjs/swagger';

export class HospitalDoctorListItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Dr. John Doe' })
  fullName: string;

  @ApiProperty({ example: 'MD', description: 'Designation', nullable: true })
  designation: string | null;

  @ApiProperty({ example: 'Cardiology', nullable: true })
  specialization: string | null;

  @ApiProperty({ example: '+1234567890' })
  phone: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({
    example: 'dr-john-doe',
    description: 'Slug generated from the full name',
  })
  slug: string;

  @ApiProperty({
    example: 'https://example.com/photos/john.jpg',
    nullable: true,
  })
  profilePhotoUrl: string | null;
}

export class HospitalDoctorsPaginatedResponseDto {
  @ApiProperty({ type: [HospitalDoctorListItemDto] })
  items: HospitalDoctorListItemDto[];

  @ApiProperty({
    example: {
      total: 42,
      page: 1,
      limit: 20,
      totalPages: 3,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
