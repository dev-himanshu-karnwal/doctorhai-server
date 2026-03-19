import { IsEnum, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AvailabilityStatus } from '../enums/availability-status.enum';

export class UpdateDoctorStatusDto {
  @ApiProperty({ example: 'doctor' })
  @IsString()
  @IsOptional()
  doctorProfileId?: string;

  @ApiProperty({ example: 'doctor' })
  @IsString()
  @IsOptional()
  updatedByAccountId?: string;

  @ApiProperty({ example: 'doctor' })
  @IsString()
  @IsOptional()
  updatedByRoleId?: string;

  @ApiProperty({
    enum: AvailabilityStatus,
    example: AvailabilityStatus.AVAILABLE,
  })
  @IsEnum(AvailabilityStatus)
  status: AvailabilityStatus;

  @ApiProperty({ required: false, example: new Date().toISOString() })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expectedAt?: Date;

  @ApiProperty({ required: false, example: 'I will be back in 10 minutes' })
  @IsOptional()
  @IsString()
  expectedAtNote?: string;
}
