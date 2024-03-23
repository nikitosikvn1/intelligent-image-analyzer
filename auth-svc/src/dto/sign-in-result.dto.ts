import { IsString } from "class-validator";

export class SignInResultDto {
  @IsString()
  status: string;

  @IsString()
  message: string;

  token: string | null;
}