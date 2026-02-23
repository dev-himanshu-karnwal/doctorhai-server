import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
    description: 'Login value (email or username)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value?.trim())
  loginValue: string;

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
