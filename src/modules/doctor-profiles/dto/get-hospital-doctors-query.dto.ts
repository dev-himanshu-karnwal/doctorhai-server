import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GetHospitalDoctorsQueryDto extends PaginationQueryDto {
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
    enum: ['fullName', 'createdAt', 'public_view_count'],
    default: 'fullName',
  })
  @IsOptional()
  @IsIn(['fullName', 'createdAt', 'public_view_count'])
  sortBy?: 'fullName' | 'createdAt' | 'public_view_count';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
