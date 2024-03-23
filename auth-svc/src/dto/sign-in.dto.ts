import { IsEmail, IsString, IsNotEmpty } from "class-validator";
import { ValidationMessages } from "./messages/validation-messages";

export class SignInDto {
  @IsEmail({}, { message: ValidationMessages.email.valid })
  @IsNotEmpty()
  email: string;

  @IsString({ message: ValidationMessages.password.string })
  @IsNotEmpty()
  password: string;
}
