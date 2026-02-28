import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
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
}
