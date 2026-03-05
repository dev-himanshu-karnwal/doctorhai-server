import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

export class BaseFilterDto<
  TField extends string = string,
> extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: TField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
