import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * When a hospital creates a doctor: same profile info as doctor self-registration.
 * Hospital chooses the username for the doctor.
 * Email must be unique per hospital (same email cannot be used twice at the same hospital).
 */
export class CreateDoctorByHospitalDto {
  @ApiProperty({ example: 'Dr. John Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  fullName: string;

  @ApiProperty({ example: 'MD', description: 'Designation' })
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  designation: string;

  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  specialization: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => value?.trim())
  phone: string;

  @ApiProperty({ example: '456 Clinic Ave', description: 'Address line 1' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Suite 10', description: 'Address line 2' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => value?.trim())
  pincode: string;

  @ApiPropertyOptional({ example: 40.7128, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.006, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: 'dr_johndoe_hospital',
    description: 'Username chosen by hospital for this doctor (must be unique)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Transform(({ value }: { value: string }) => value?.trim())
  username: string;

  @ApiProperty({ example: 'securePassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ description: 'Bio' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ description: 'Profile photo URL' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  profilePhotoUrl?: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Hospital ID (required when creating doctor from hospital)',
  })
  @IsString()
  @MinLength(1)
  hospitalId: string;
}
