import { ApiProperty } from '@nestjs/swagger';

export class SignUpResultDto {
  @ApiProperty()
  success: boolean;
}