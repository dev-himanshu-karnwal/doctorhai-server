import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for adding a role to an account (e.g. POST /accounts/:id/roles).
 * grantedAt is set by the server.
 */
export class AddRoleToAccountDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Role ID (ObjectId) to assign',
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
