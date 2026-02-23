import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  REGISTRATION_TYPE,
  type RegistrationType,
} from '../enums/registration-type.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'doctor',
    enum: REGISTRATION_TYPE,
    description: 'Who is registering: hospital or doctor',
  })
  @IsEnum(REGISTRATION_TYPE)
  registrationType: RegistrationType;

  @ApiProperty({
    example: 'Dr. Jane Smith',
    description: 'Full name (hospital name when registrationType is hospital)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => value?.trim())
  phone: string;

  @ApiProperty({ example: '123 Main St', description: 'Address line 1' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Apt 4', description: 'Address line 2' })
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

  @ApiProperty({ example: 'securePassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    example: 'dr_janesmith',
    description: 'Required when registrationType is doctor; must be unique',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'doctor')
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Transform(({ value }: { value: string }) => value?.trim())
  username?: string;

  @ApiProperty({
    example: 'city-hospital-mumbai',
    description:
      'Required when registrationType is hospital. URL-friendly slug',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'hospital')
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  slug?: string;

  @ApiPropertyOptional({
    description: 'Hospital cover photo URL',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'hospital')
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverPhotoUrl?: string;

  /** Required when registrationType is doctor. Use name for doctor full name. */
  @ApiProperty({
    example: 'MD',
    description:
      'Required when registrationType is doctor. Designation (e.g. MD, MBBS)',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'doctor')
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  designation?: string;

  @ApiProperty({
    example: 'Cardiology',
    description:
      'Required when registrationType is doctor. Medical specialization',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'doctor')
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  specialization?: string;

  @ApiProperty({
    example: 'dr-jane-smith',
    description:
      'Required when registrationType is doctor. URL-friendly slug for doctor profile',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'doctor')
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Transform(({ value }: { value: string }) => value?.trim())
  doctorSlug?: string;

  @ApiPropertyOptional({
    example: 'Experienced cardiologist with 15 years of practice.',
    description: 'Doctor bio (optional)',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'doctor')
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Doctor profile photo URL (optional)',
  })
  @ValidateIf((o: RegisterDto) => o.registrationType === 'doctor')
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  profilePhotoUrl?: string;
}
