import { ApiProperty } from '@nestjs/swagger';

export class HospitalStats {
  @ApiProperty({ example: 10 })
  total_hospital_count: number;

  @ApiProperty({ example: 5 })
  total_verified_count: number;

  @ApiProperty({ example: 5 })
  total_unverified_count: number;
}
