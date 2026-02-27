import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class ForgotPasswordVerifyDto {
  @ApiProperty({
    example: 'user@mail.com',
    description: 'Email used to request password reset',
  })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP sent to email',
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
