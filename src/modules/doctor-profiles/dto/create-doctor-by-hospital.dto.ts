import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
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

  @ApiProperty({ example: 'Cardiology', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  specialization?: string;
}
