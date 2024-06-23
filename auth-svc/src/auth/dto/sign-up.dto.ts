import { IsEmail, IsString, IsStrongPassword, MinLength, MaxLength, IsAlpha, IsNotEmpty } from "class-validator";
import { ValidationMessages } from "../../dto/messages/validation-messages";

/**
 * Data Transfer Object (DTO) used for new user registration. This class validates user input against 
 * defined criteria to ensure data integrity and security before processing the sign-up operation.
 * Custom validation messages provided from `ValidationMessages` enhance user feedback.
 */
export class SignUpDto {
  /**
   * The user's first name, validated to ensure it is a string, consists only of alphabetic characters,
   * and is not empty.
   * 
   * @IsString Ensures the input is a string.
   * @IsAlpha Validates the input contains only alphabetic characters for the "en-US" locale.
   * @IsNotEmpty Prevents empty values.
   */
  @IsString({ message: ValidationMessages.firstName.string })
  @IsAlpha("en-US", { message: ValidationMessages.firstName.alpha })
  @IsNotEmpty()
  firstname: string;

  /**
   * The user's last name, validated similarly to the first name to ensure data format and integrity.
   * 
   * @IsString Ensures the input is a string.
   * @IsAlpha Validates the input contains only alphabetic characters for the "en-US" locale.
   * @IsNotEmpty Prevents empty values.
   */
  @IsString({ message: ValidationMessages.lastName.string })
  @IsAlpha("en-US", { message: ValidationMessages.lastName.alpha })
  @IsNotEmpty()
  lastname: string;

  /**
   * The user's email address, validated to confirm it is not empty and follows a valid email format.
   * 
   * @IsEmail Validates the input is a well-formed email address.
   * @IsNotEmpty Prevents empty values.
   */
  @IsEmail({}, { message: ValidationMessages.email.valid })
  @IsNotEmpty()
  email: string;

  /**
   * The user's chosen password, undergoing extensive validation to ensure it meets security standards,
   * including length and complexity requirements.
   * 
   * @IsString Ensures the input is a string.
   * @MinLength Sets the minimum length of the password to 8 characters.
   * @MaxLength Limits the password length to a maximum of 128 characters.
   * @IsStrongPassword Validates the password against specified complexity requirements, including
   * the presence of lowercase and uppercase letters, numbers, and symbols.
   * @IsNotEmpty Prevents empty values.
   */
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
