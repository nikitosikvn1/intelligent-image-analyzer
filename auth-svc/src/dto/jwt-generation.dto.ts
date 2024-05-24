import { IsEmail, IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ValidationMessages } from "./messages/validation-messages";

/**
 * Data Transfer Object (DTO) for a sign-in request. It validates user credentials, ensuring they meet
 * specific criteria before proceeding with authentication. Validation messages are customized through
 * a centralized messages repository to enhance user feedback.
 */
export class JwtGenerationDto {
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


  /**
   * Optional flag indicating whether the request is for a token refresh operation.
   * If set to true, the system will generate a new access token and refresh token pair.
   *
   * @isOptional Decorator that marks the property as optional, allowing it to be omitted from the request payload.
   * @IsBoolean Decorator that validates the property is a boolean, enforcing that the validation result is explicitly expressed as either true or false.
    */
  @IsOptional()
  isRefreshToken?: boolean;
}
