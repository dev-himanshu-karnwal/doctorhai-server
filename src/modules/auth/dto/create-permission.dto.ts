import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users:read', description: 'Unique permission key' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  key: string;

  @ApiPropertyOptional({ example: 'Allow reading user data' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;
}
