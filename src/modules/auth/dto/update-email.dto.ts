import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsMongoId } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({
    example: 'newemail@example.com',
    description: 'New email address for the account',
  })
  @IsEmail()
  @IsString()
  newEmail: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description:
      'Account ID to update (superadmin only). Omit to update own account.',
  })
  @IsOptional()
  @IsMongoId()
  accountId?: string;
}
