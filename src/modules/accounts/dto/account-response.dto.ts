import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccountRoleResponseDto {
  @ApiProperty()
  roleId: string;

  @ApiPropertyOptional()
  grantedBy: string | null;

  @ApiProperty()
  grantedAt: Date;
}

export class AccountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  loginType: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  username: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ type: [AccountRoleResponseDto] })
  roles: AccountRoleResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  doctor?: {
    id: string;
    fullName: string;
    designation: string | null;
    specialization: string | null;
    phone: string;
    email: string;
    slug: string;
    profilePhotoUrl: string | null;
  } | null;

  @ApiPropertyOptional()
  hospital?: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    email: string;
    coverPhotoUrl: string | null;
    isActive: boolean;
    type?: string | null;
  } | null;

  @ApiPropertyOptional()
  address?: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}
