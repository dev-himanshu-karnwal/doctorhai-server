import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';
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
}
