import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAccountVerificationDto {
  @ApiProperty({
    description: 'The verification status to set for the account',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isVerified: boolean;
}
