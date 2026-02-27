import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressMeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  addressLine1: string;

  @ApiPropertyOptional()
  addressLine2: string | null;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  pincode: string;

  @ApiPropertyOptional()
  latitude: number | null;

  @ApiPropertyOptional()
  longitude: number | null;
}

export class AccountMeDto {
  @ApiProperty({ description: 'Account ID' })
  id: string;

  @ApiProperty({ example: 'username', description: 'Login type' })
  loginType: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Primary email for the account',
  })
  email: string;

  @ApiPropertyOptional({
    example: 'dr_janesmith',
    description:
      'Username for doctor accounts; null for non-doctor accounts (e.g. hospitals, superadmin)',
  })
  username: string | null;

  @ApiProperty({
    example: ['doctor'],
    description: 'Role names',
    type: [String],
  })
  roles: string[];

  @ApiProperty({ description: 'Whether account is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Account last update timestamp' })
  updatedAt: Date;
}

export class HospitalMeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  coverPhotoUrl: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: AddressMeDto })
  address?: AddressMeDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DoctorMeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  designation: string;

  @ApiProperty()
  specialization: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  bio: string | null;

  @ApiPropertyOptional()
  profilePhotoUrl: string | null;

  @ApiPropertyOptional({ description: 'Hospital ID if doctor is affiliated' })
  hospitalId: string | null;

  @ApiPropertyOptional({ type: AddressMeDto })
  address?: AddressMeDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MeResponseDto {
  @ApiProperty({ type: AccountMeDto })
  account: AccountMeDto;

  @ApiPropertyOptional({
    type: HospitalMeDto,
    description: 'Present when user has hospital role',
  })
  hospital?: HospitalMeDto;

  @ApiPropertyOptional({
    type: DoctorMeDto,
    description: 'Present when user has doctor role',
  })
  doctor?: DoctorMeDto;
}
