import { IsBoolean, IsString } from 'class-validator';

/**
 * Data Transfer Object (DTO) representing the result of JWT token validation.
 * It encapsulates whether the token is valid and provides a detailed message explaining the validation outcome.
 * This DTO is useful for operations that require token authentication and need to communicate the results
 * of such checks, such as access control decisions or token integrity checks.
 */
export class JwtRefreshFailureResultDto {
  /**
   * Indicates the validity of the JWT token. True if the token is valid, false otherwise.
   * This property is crucial for conditional flows in authentication and authorization processes.
   * 
   * @IsBoolean Decorator that validates the property is a boolean, enforcing that the validation result is explicitly expressed as either true or false.
   */
  @IsBoolean()
  isValid: boolean;

  /**
   * Provides a descriptive message about the JWT token's validation result. This might include information
   * on why the token was deemed invalid if that is the case, helping in debugging or informing users.
   * 
   * @IsString Decorator that validates the property is a string, ensuring the message is textual and comprehensible.
   */
  @IsString()
  message: string;
}
