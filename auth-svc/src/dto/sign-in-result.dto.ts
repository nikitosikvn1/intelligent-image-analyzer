import { IsString } from "class-validator";

/**
 * Data Transfer Object (DTO) representing the result of a sign-in operation.
 * This DTO includes the operation's status, a message for additional context,
 * and potentially a JWT token if the sign-in was successful.
 */
export class SignInResultDto {
  /**
   * Indicates the status of the sign-in operation, typically values like 'success' or 'failure'.
   * 
   * @IsString Validates that the status is provided as a string.
   */
  @IsString()
  status: string;

  /**
   * Provides a human-readable message related to the sign-in result, offering
   * further detail or action suggestions.
   * 
   * @IsString Validates that the message is provided as a string.
   */
  @IsString()
  message: string;

  /**
   * The JWT token generated upon a successful sign-in. This field is nullable, indicating
   * that a token will only be present if the sign-in succeeds.
   */
  token: string | null;
}
