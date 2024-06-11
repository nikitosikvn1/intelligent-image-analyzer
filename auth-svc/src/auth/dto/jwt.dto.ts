import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object (DTO) for carrying JWT tokens in requests. It ensures the token is both
 * present and correctly formatted as a string, facilitating secure and validated token transportation.
 */
export class JwtDto {
  /**
   * The JWT token used for authentication or other security-related operations.
   * 
   * @IsString Ensures the token is of string type, validating its format.
   * @IsNotEmpty Ensures the token field is not empty, validating its presence.
   */
  @IsString()
  @IsNotEmpty()
  token: string;
}
