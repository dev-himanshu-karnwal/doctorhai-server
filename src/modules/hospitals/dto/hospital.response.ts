import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ example: ['Cardiology', 'Neurology'] })
  specialist: string[];
}

export class HospitalDetailAddressDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439013' })
  id: string;

  @ApiProperty({ example: '123 Main St' })
  addressLine1: string;

  @ApiProperty({ example: 'Suite 400', nullable: true })
  addressLine2: string | null;

  @ApiProperty({ example: 'New Delhi' })
  city: string;

  @ApiProperty({ example: 'Delhi' })
  state: string;

  @ApiProperty({ example: '110001' })
  pincode: string;
}

import { DoctorStatusResponseDto } from '../../doctor-profiles/dto/doctor-profile-response.dto';

export class HospitalDoctorDetailDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Dr. John Doe' })
  fullName: string;

  @ApiProperty({ example: 'MD', nullable: true })
  designation: string | null;

  @ApiProperty({ example: 'Cardiology', nullable: true })
  specialization: string | null;

  @ApiProperty({ example: 'dr-john-doe' })
  slug: string;

  @ApiProperty({
    example: 'https://example.com/photos/john.jpg',
    nullable: true,
  })
  profilePhotoUrl: string | null;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ type: DoctorStatusResponseDto })
  status?: DoctorStatusResponseDto | null;

  @ApiPropertyOptional({ example: '10 years' })
  hasExperience?: string | null;
}

export class HospitalDoctorsPaginatedDto {
  @ApiProperty({ type: [HospitalDoctorDetailDto] })
  items: HospitalDoctorDetailDto[];

  @ApiProperty({
    example: {
      total: 10,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class HospitalDetailDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  accountId: string;

  @ApiProperty({ example: 'City Care Hospital' })
  name: string;

  @ApiProperty({ example: 'city-care-hospital' })
  slug: string;

  @ApiProperty({ example: '+919999999999' })
  phone: string;

  @ApiProperty({ example: 'contact@citycare.com' })
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

  @ApiProperty({
    example: [{ day: 'Monday', opentime: '09:00', closetime: '18:00' }],
    nullable: true,
  })
  timeline?: { day: string; opentime: string; closetime: string }[] | null;

  @ApiProperty({ example: ['Emergency', 'ICU'], nullable: true })
  facilities?: string[] | null;

  @ApiProperty({ type: HospitalDetailAddressDto, nullable: true })
  address: HospitalDetailAddressDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
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
