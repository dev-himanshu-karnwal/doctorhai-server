import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccountRoleAssignmentDto } from './account-role-assignment.dto';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Primary email for the account',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Hashed password' })
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Set when password was last updated (server-side)',
    example: '2025-01-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  passwordUpdatedAt?: string;

  @ApiPropertyOptional({
    description: 'Replace all role assignments (full set)',
    type: [AccountRoleAssignmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountRoleAssignmentDto)
  roles?: AccountRoleAssignmentDto[];
}
