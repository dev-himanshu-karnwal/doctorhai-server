import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Account ID',
  })
  accountId: string;

  @ApiProperty({
    example: 'username',
    description: 'Login type used for this account',
  })
  loginType: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Primary email for this account',
  })
  email: string;

  @ApiPropertyOptional({
    example: 'dr_janesmith',
    description:
      'Username for doctor accounts; null for non-doctor accounts (e.g. hospitals, superadmin)',
  })
  username: string | null;
}
