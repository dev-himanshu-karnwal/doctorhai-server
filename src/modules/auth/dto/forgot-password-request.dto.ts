import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgotPasswordRequestDto {
  @ApiProperty({
    example: 'user@mail.com',
    description: 'Email associated with the account(s)',
  })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;
}
