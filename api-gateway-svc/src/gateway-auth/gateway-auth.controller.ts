import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { GatewayAuthService } from './gateway-auth.service';
import { lastValueFrom } from 'rxjs';

/**
 * GatewayAuthController handles HTTP requests related to user authentication.
 * It defines endpoints for signing up, signing in, and validating JWT tokens.
 */
@Controller('auth')
export class GatewayAuthController {
  /**
   * Initializes GatewayAuthController with GatewayAuthService.
   *
   * @param {GatewayAuthService} gatewayAuthService Instance of GatewayAuthService for handling authentication requests.
   */
  constructor(private readonly gatewayAuthService: GatewayAuthService) {}

  /**
   * Endpoint for user registration (sign-up).
   *
   * @param {object} data Data object containing sign-up details.
   * @returns {Promise<object>} Promise with the result of sign-up operation.
   * @throws {HttpException} If sign-up operation fails.
   */
  @Post('signup')
  async signUp(@Body() data: object): Promise<object> {
    try {
      return await lastValueFrom(this.gatewayAuthService.signUp(data));
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * Endpoint for user authentication (sign-in).
   *
   * @param {object} data Data object containing sign-in credentials.
   * @returns {Promise<object>} Promise with the result of sign-in operation.
   * @throws {HttpException} If sign-in operation fails.
   */
  @Post('signin')
  async signIn(@Body() data: object): Promise<object> {
    try {
      return await lastValueFrom(this.gatewayAuthService.signIn(data));
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  /**
   * Endpoint for refreshing JWT token.
   *
   * @param {object} data Data object containing refresh token.
   * @returns {Promise<object>} Promise with the result of token refresh operation.
   * @throws {HttpException} If token refresh operation fails.
   */
  @Post('refresh')
  async refreshToken(@Body() data: object): Promise<object> {
    try {
      return await lastValueFrom(this.gatewayAuthService.refreshToken(data));
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
