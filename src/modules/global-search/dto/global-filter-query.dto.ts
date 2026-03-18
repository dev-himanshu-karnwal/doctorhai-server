import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GlobalFilterQueryDto {
  @ApiPropertyOptional({ description: 'Search term for name or title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by doctor speciality' })
  @IsOptional()
  @IsString()
  speciality?: string;

  @ApiPropertyOptional({ description: 'Filter by doctor designation' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ description: 'Filter by doctor experience years' })
  @IsOptional()
  @IsString()
  hasexperience?: string;

  @ApiPropertyOptional({
    description: 'Filter by doctor status (e.g., available)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Latitude for distance filtering' })
  @ValidateIf((o) => o.distance !== undefined)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for distance filtering' })
  @ValidateIf((o) => o.distance !== undefined)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ description: 'Distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distance?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'createdAt',
    enum: ['name', 'fullName', 'createdAt', 'public_view_count'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
