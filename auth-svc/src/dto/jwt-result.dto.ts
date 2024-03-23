import { IsBoolean, IsString } from 'class-validator';

export class JwtResultDto {
  @IsBoolean()
  isValid: boolean;

  @IsString()
  message: string;
}