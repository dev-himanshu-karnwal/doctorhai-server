import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordProfileDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Account ID associated with this profile',
  })
  accountId: string;

  @ApiProperty({
    example: 'doctor',
    enum: ['doctor', 'hospital'],
  })
  type: 'doctor' | 'hospital';

  @ApiProperty({
    example: 'Dr. Jane Smith',
    description: 'Display name for this profile',
  })
  name: string;
}

export class ForgotPasswordVerifyResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived token used only for password reset',
  })
  resetToken: string;

  @ApiProperty({
    type: [ForgotPasswordProfileDto],
    description:
      'Profiles linked to the email. User must choose which account to reset.',
  })
  profiles: ForgotPasswordProfileDto[];
}
