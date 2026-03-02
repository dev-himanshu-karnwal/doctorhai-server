import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyPasswordDto {
  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
