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
    description: 'Sort field',
    enum: ['name', 'createdAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt'])
  sortBy?: 'name' | 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
