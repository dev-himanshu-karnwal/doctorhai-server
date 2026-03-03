import { ApiProperty } from '@nestjs/swagger';

export class VerifyPasswordResponseDto {
  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: 'Password verified successfully' })
  message: string;
}
