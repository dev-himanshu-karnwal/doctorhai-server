import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GetHospitalsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Free-text search across name, type, and specialist (doctor specialization)',
    example: 'city care',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by hospital name (partial, case-insensitive match)',
    example: 'City',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({
    description: 'Filter by account verification status',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  isVerified?: string;

  @ApiPropertyOptional({
    description: 'Filter by doctor availability in the hospital',
    example: 'true',
  })
  @IsOptional()
  @IsBooleanString()
  isAvailable?: string;

  @ApiPropertyOptional({
    description: 'Filter by doctor specialities in the hospital',
    example: 'Cardiology,Neurology',
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) => {
    if (typeof value === 'string') return value.split(',').map((s) => s.trim());
    return value;
  })
  specialities?: string[];

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'createdAt', 'public_view_count'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'public_view_count'])
  sortBy?: 'name' | 'createdAt' | 'public_view_count';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
