import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GetHospitalDoctorsQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description:
      'Free-text search across name, specialization, designation, email',
    example: 'cardio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by specialization (partial, case-insensitive match)',
    example: 'Cardiology',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  specialization?: string;

  @ApiPropertyOptional({
    description: 'Filter by designation (partial, case-insensitive match)',
    example: 'MD',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  designation?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['fullName', 'createdAt'],
    default: 'fullName',
  })
  @IsOptional()
  @IsIn(['fullName', 'createdAt'])
  sortBy?: 'fullName' | 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
