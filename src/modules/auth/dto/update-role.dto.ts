import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'editor' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ example: 'Content editor role' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({
    example: ['507f1f77bcf86cd799439011'],
    description: 'Permission IDs (ObjectIds) assigned to this role',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
