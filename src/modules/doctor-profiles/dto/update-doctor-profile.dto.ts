import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDoctorProfileDto {
  @ApiProperty({ example: 'Dr. John Doe', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  fullName?: string;

  @ApiProperty({ example: 'Senior Consultant', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  designation?: string;

  @ApiProperty({ example: 'Cardiology', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  specialization?: string;

  @ApiProperty({
    example: 'Experienced cardiologist with 15 years...',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiProperty({
    example: '5 years in cardiology',
    description:
      "Indicates the doctor's experience level. Can only be set on update.",
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hasExperience?: string;
}
