import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Headers,
} from '@nestjs/common';
import { GatewayAuthService } from './gateway-auth.service';
import { lastValueFrom, Observable } from 'rxjs';

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
   * @async
   * @param {object} data Data object containing sign-up details.
   * @returns {Promise<Observable<object>>} Observable with the result of sign-up operation.
   * @throws {HttpException} If sign-up operation fails.
   */
  @Post('signup')
  async signUp(@Body() data: object): Promise<Observable<object>> {
    try {
      return await this.gatewayAuthService.signUp(data);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Endpoint for user authentication (sign-in).
   *
   * @async
   * @param {object} data Data object containing sign-in credentials.
   * @returns {Promise<Observable<object>>} Observable with the result of sign-in operation.
   * @throws {HttpException} If sign-in operation fails.
   */
  @Post('signin')
  async signIn(@Body() data: object): Promise<Observable<object>> {
    try {
      return await this.gatewayAuthService.signIn(data);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  /**
   * Endpoint for validating JWT tokens.
   *
   * @async
   * @param {string} data The JWT token retrieved from the request headers.
   * @returns {Promise<object>} Result of token validation operation.
   * @throws {HttpException} If token validation operation fails.
   */
  @Post('validate-token')
  async validateToken(@Headers('token') data: string): Promise<object> {
    try {
      return await lastValueFrom(
        this.gatewayAuthService.validateToken({ token: data }),
      );
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
