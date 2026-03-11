import { ApiProperty } from '@nestjs/swagger';

export class DoctorStats {
  @ApiProperty({ example: 10 })
  total_doctor_count: number;

  @ApiProperty({ example: 5 })
  total_verfied_count: number;

  @ApiProperty({ example: 5 })
  total_unverified_count: number;

  @ApiProperty({ example: 5 })
  total_available: number;
}
