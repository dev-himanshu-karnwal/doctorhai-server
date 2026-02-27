import { ApiProperty } from '@nestjs/swagger';

export class CheckUsernameResponseDto {
  @ApiProperty({
    example: 'dr_janesmith',
    description: 'The username that was checked',
  })
  username: string;

  @ApiProperty({
    example: true,
    description: 'True if username is available for use',
  })
  available: boolean;
}
