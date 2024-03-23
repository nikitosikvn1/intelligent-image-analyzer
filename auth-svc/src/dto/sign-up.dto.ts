import { IsEmail, IsString, IsStrongPassword, MinLength, MaxLength, IsAlpha, IsNotEmpty } from "class-validator";
import { ValidationMessages } from "./messages/validation-messages";

export class SignUpDto {
  @IsString({ message: ValidationMessages.firstName.string })
  @IsAlpha("en-US", { message: ValidationMessages.firstName.alpha })
  @IsNotEmpty()
  firstname: string;

  @IsString({ message: ValidationMessages.lastName.string })
  @IsAlpha("en-US", { message: ValidationMessages.lastName.alpha })
  @IsNotEmpty()
  lastname: string;

  @IsEmail({}, { message: ValidationMessages.email.valid })
  @IsNotEmpty()
  email: string;

  @IsString({ message: ValidationMessages.password.string })
  @MinLength(8, { message: ValidationMessages.password.minLength })
  @MaxLength(128, { message: ValidationMessages.password.maxLength })
  @IsStrongPassword({
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  }, { message: ValidationMessages.password.strong })
  @IsNotEmpty()
  password: string;
}
