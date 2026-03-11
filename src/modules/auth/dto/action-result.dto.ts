import { ApiProperty } from '@nestjs/swagger';

export class ActionResultDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Action completed successfully' })
  message: string;
}
