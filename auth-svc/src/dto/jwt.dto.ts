import { IsNotEmpty, IsString } from 'class-validator';

export class JwtDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}