import { IsEmail, IsString, IsNotEmpty } from "class-validator";
import { ValidationMessages } from "./messages/validation-messages";

/**
 * Data Transfer Object (DTO) for a sign-in request. It validates user credentials, ensuring they meet
 * specific criteria before proceeding with authentication. Validation messages are customized through
 * a centralized messages repository to enhance user feedback.
 */
export class SignInDto {
  /**
   * User's email address, serving as the unique identifier for sign-in.
   * It undergoes two layers of validation: it must be a well-formed email address and cannot be empty.
   * Custom validation messages are provided for clarity and user guidance.
   * 
   * @IsEmail Enforces email format validation. Custom message from ValidationMessages is used upon validation failure.
   * @IsNotEmpty Ensures the email field is not left blank.
   */
  @IsEmail({}, { message: ValidationMessages.email.valid })
  @IsNotEmpty()
  email: string;

  /**
   * User's password for sign-in. The password must be a string and cannot be empty.
   * A custom validation message is set to guide users in case of input mismatch.
   * 
   * @IsString Validates that the password is of string type, enhancing security by enforcing expected data format. A custom message is provided for cases where the input does not meet this criterion.
   * @IsNotEmpty Ensures the password field is not left blank, maintaining the integrity of authentication requests.
   */
  @IsString({ message: ValidationMessages.password.string })
  @IsNotEmpty({message: ValidationMessages.password.required})
  password: string;
}
