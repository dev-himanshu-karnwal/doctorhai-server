import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';
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
}
