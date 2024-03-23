import { IsString } from "class-validator";

export class SignUpResultDto {
  @IsString()
  status: string;

  message: string | Array<string>;
}