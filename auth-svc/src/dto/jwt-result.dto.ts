import { IsBoolean, IsString } from 'class-validator';

/**
 * Data Transfer Object (DTO) representing the result of JWT token validation.
 * It encapsulates the validation outcome and a message detailing the validation result.
 */
export class JwtResultDto {
  /**
   * Indicates the validity of the JWT token.
   * 
   * @IsBoolean Decorator that validates the property is a boolean, enforcing the type of validation result.
   */
  @IsBoolean()
  isValid: boolean;

  /**
   * Provides feedback or details about the JWT token validation result.
   * 
   * @IsString Decorator that validates the property is a string, ensuring the message is textual.
   */
  @IsString()
  message: string;
}
