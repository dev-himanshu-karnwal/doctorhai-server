import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @ApiPropertyOptional({ example: 28.6139 })
  @IsOptional()
  latitude: number;

  @ApiPropertyOptional({ example: 77.209 })
  @IsOptional()
  longitude: number;
}

class TimelineItemDto {
  @ApiPropertyOptional({ example: 'Monday' })
  @IsString()
  day: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  opentime: string;

  @ApiPropertyOptional({ example: '21:00' })
  @IsString()
  closetime: string;
}

export class UpdateHospitalDto {
  @ApiPropertyOptional({ example: 'City Care Hospital' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@citycare.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsString()
  @IsOptional()
  coverPhotoUrl?: string;

  @ApiPropertyOptional({ type: LocationDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({ example: 'Multispeciality' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ type: [TimelineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimelineItemDto)
  timeline?: TimelineItemDto[];

  @ApiPropertyOptional({ example: ['Emergency', 'ICU'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
