import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetAccountVerifiedDto {
  @ApiProperty({
    example: true,
    description: 'Whether to verify (true) or unverify (false) the account',
  })
  @IsBoolean()
  verified: boolean;
}
