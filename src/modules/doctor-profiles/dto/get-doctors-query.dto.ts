import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsNumber, IsOptional } from 'class-validator';
import { GetHospitalDoctorsQueryDto } from './get-hospital-doctors-query.dto';

export class GetDoctorsQueryDto extends GetHospitalDoctorsQueryDto {
  @ApiPropertyOptional({
    description:
      'Optional hospital ID to filter doctors belonging to a specific hospital',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId()
  hospitalId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by account verification status. Omit to return all doctors.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by availability status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by specialities (comma-separated)',
    example: 'Cardiology,Neurology',
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) => {
    if (typeof value === 'string') return value.split(',').map((s) => s.trim());
    return value;
  })
  specialities?: string[];

  @ApiPropertyOptional({
    description: 'Filter by experience levels (comma-separated)',
    example: '1-3 years,5+ years',
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) => {
    if (typeof value === 'string') return value.split(',').map((s) => s.trim());
    return value;
  })
  experience?: string[];

  @ApiPropertyOptional({
    description: 'Latitude of the user',
    example: '12.9716',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseFloat(value))
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of the user',
    example: '77.5946',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseFloat(value))
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Distance from the user',
    example: '10',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: { value: string }) => parseFloat(value))
  distance?: number;
}
