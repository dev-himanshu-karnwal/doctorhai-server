import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AccountRoleAssignmentDto } from './account-role-assignment.dto';

export const LOGIN_TYPE = ['email', 'username'] as const;
export type LoginType = (typeof LOGIN_TYPE)[number];

export class CreateAccountDto {
  @ApiProperty({
    example: 'email',
    enum: LOGIN_TYPE,
    description: 'Type of login identifier',
  })
  @IsEnum(LOGIN_TYPE)
  loginType: LoginType;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Primary email for the account (required for all roles)',
  })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email: string;

  @ApiPropertyOptional({
    example: 'dr_janesmith',
    description:
      'Username (required for doctor accounts; must be globally unique; must be absent for non-doctor accounts)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  username?: string | null;

  @ApiPropertyOptional({
    description: 'Hashed password (set by server; never send plain password)',
  })
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [AccountRoleAssignmentDto],
    description: 'Initial role assignments',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountRoleAssignmentDto)
  roles?: AccountRoleAssignmentDto[];
}
