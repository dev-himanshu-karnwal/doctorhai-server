import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Role assignment for account create/update (nested in roles array).
 * grantedAt is set by the server.
 */
export class AccountRoleAssignmentDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Role ID (ObjectId)',
  })
  @IsString()
  roleId: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439012',
    description: 'Account ID (ObjectId) that granted this role',
  })
  @IsOptional()
  @IsString()
  grantedBy?: string;
}
