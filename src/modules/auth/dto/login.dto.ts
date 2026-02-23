import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { LOGIN_TYPE, type LoginType } from './create-account.dto';

/**
 * Login: hospital use email+password; doctor uses username+password.
 * loginType indicates which identifier to use.
 */
export class LoginDto {
  @ApiProperty({
    example: 'username',
    enum: LOGIN_TYPE,
    description: "'email' for hospital, 'username' for doctor",
  })
  @IsEnum(LOGIN_TYPE)
  loginType: LoginType;

  @ApiPropertyOptional({
    example: 'hospital@example.com',
    description: 'Required when loginType is email',
  })
  @ValidateIf((o: LoginDto) => o.loginType === 'email')
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({
    example: 'dr_janesmith',
    description: 'Required when loginType is username',
  })
  @ValidateIf((o: LoginDto) => o.loginType === 'username')
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  username?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password: string;
}
