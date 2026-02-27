import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'users:write' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }: { value: string }) => value?.trim())
  key?: string;

  @ApiPropertyOptional({ example: 'Allow writing user data' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;
}
