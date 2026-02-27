import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CheckUsernameDto {
  @ApiProperty({
    example: 'dr_janesmith',
    description:
      'Username to check for availability (unique for doctor accounts)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Transform(({ value }: { value: string }) => value?.trim())
  username: string;
}
