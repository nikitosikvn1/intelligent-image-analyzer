import { IsString, IsNotEmpty } from "class-validator";

/**
 * Data Transfer Object (DTO) for holding the result of a JWT generation process.
 * This DTO includes the access token and optionally a refresh token that are generated
 * during authentication or token refresh operations.
 */
export class JwtGenerationResultDto {
  /**
   * The JWT access token that is generated upon successful authentication or token renewal.
   * This token is typically used to maintain and manage the session state and must be sent
   * in subsequent requests to access protected resources.
   * 
   * @IsString Ensures that the accessToken is a string.
   * @IsNotEmpty Ensures that the accessToken is not empty, guaranteeing that a valid token is always provided.
   */
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  /**
   * The JWT refresh token that may be generated along with the access token.
   * This token is used to obtain a new access token when the current access token is about to expire or has expired.
   * It is optional and may not be provided in all scenarios, such as when the system does not support refresh tokens.
   * 
   * @IsString Ensures that the refreshToken, if provided, is a string.
   * @IsNotEmpty Ensures that the refreshToken is not empty, guaranteeing that a valid token is provided.
   */
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
