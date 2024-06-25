import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GatewayAuthService } from '../gateway-auth.service';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request } from 'express';
import { lastValueFrom, map } from 'rxjs';

/**
 * JwtAuthGuard is a custom guard that integrates JWT validation with rate limiting.
 * It ensures that requests are either authenticated via a valid JWT or are subject
 * to rate limitations based on the requester's IP address.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private rateLimiter: RateLimiterMemory;

  /**
   * Constructs the guard using the GatewayAuthService for JWT validation and
   * initializes a memory-based rate limiter.
   */
  constructor(private readonly authService: GatewayAuthService) {
    this.rateLimiter = new RateLimiterMemory({
      points: 3, // Allow 3 requests
      duration: 3600, // Within 1 hour
    });
  }

  /**
   * Determines if an HTTP request is allowed to proceed based on JWT validity or rate limit status.
   *
   * @param {ExecutionContext} context The execution context providing details about the current request.
   * @returns {Promise<boolean>} A promise resolving to `true` if the request is allowed, otherwise throws an exception.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['token'];
    const ip = request.ip;

    if (token) {
      try {
        // Validate the JWT token and extract the 'isValid' property from the response.
        const isValid = await lastValueFrom(
          this.authService
            .validateToken({ token })
            .pipe(map((response: any) => response.isValid)),
        );

        // Return true if the token is valid, allowing the request to proceed.
        return isValid;
      } catch (error) {
        // Rethrow any errors encountered during JWT validation.
        throw error;
      }
    }

    // If no token is present, apply rate limiting based on the requester's IP address.
    try {
      await this.rateLimiter.consume(ip); // Consume a point from the rate limiter.
      return true; // Allow the request if under rate limit.
    } catch (rateLimiterRes) {
      // If the rate limit is exceeded, throw an HTTP exception with a 429 status.
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
