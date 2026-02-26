import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class ForgotPasswordResetDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Account ID whose password will be changed',
  })
  @IsMongoId()
  accountId: string;

  @ApiProperty({
    example: 'NewSecurePassword123',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
