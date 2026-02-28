import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({
    example: 'newemail@example.com',
    description: 'New email address for the account',
  })
  @IsEmail()
  @IsString()
  newEmail: string;
}
