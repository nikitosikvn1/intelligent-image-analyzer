import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { GatewayAuthService } from './gateway-auth.service';
import { lastValueFrom } from 'rxjs';

/**
 * GatewayAuthController handles HTTP requests related to user authentication.
 * It defines endpoints for signing up and signing in, validating JWT tokens.
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
  signUp(@Body() data: object): Promise<object> {
    try {
      return lastValueFrom(this.gatewayAuthService.signUp(data));
    } catch (error) {
      throw new HttpException(error.message, error.status);
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
  signIn(@Body() data: object): Promise<object> {
    try {
      return lastValueFrom(this.gatewayAuthService.signIn(data));
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
