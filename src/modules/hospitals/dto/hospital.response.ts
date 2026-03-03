import { ApiProperty } from '@nestjs/swagger';

export class HospitalListItemDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  accountId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439013',
    nullable: true,
  })
  addressId: string | null;

  @ApiProperty({ example: 'City Care Hospital' })
  name: string;

  @ApiProperty({
    example: 'city-care-hospital',
    description: 'Unique slug generated from hospital name',
  })
  slug: string;

  @ApiProperty({ example: '+1234567890' })
  phone: string;

  @ApiProperty({ example: 'info@citycare.com' })
  email: string;

  @ApiProperty({
    example: 'https://example.com/images/cover.jpg',
    nullable: true,
  })
  coverPhotoUrl: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({
    example: { latitude: 28.6139, longitude: 77.209 },
    nullable: true,
  })
  location?: { latitude: number; longitude: number } | null;

  @ApiProperty({ example: 'Multispeciality', nullable: true })
  type?: string | null;

  @ApiProperty({ example: ['Emergency', 'ICU'], nullable: true })
  facilities?: string[] | null;

  @ApiProperty({ example: ['Cardiology', 'Neurology'] })
  specialist: string[];

  @ApiProperty({
    example: '2026-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-02T12:00:00.000Z',
  })
  updatedAt: Date;
}

export class HospitalPaginatedResponseDto {
  @ApiProperty({ type: [HospitalListItemDto] })
  items: HospitalListItemDto[];

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
