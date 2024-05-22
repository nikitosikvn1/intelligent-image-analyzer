import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

/**
 * GatewayAuthService handles communication with the authentication microservice.
 * It sends requests to authorize and authenticate users, checks whether the
 * JWT token is valid and refreshes tokens.
 */
@Injectable()
export class GatewayAuthService {
  /**
   * Initializes GatewayAuthService with the authentication microservice client.
   *
   * @param {ClientProxy} authService Injected client proxy for communicating with the authentication microservice.
   */
  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: ClientProxy,
  ) {}

  /**
   * Sends sign-in request to the authentication microservice.
   *
   * @param {object} data Data object containing sign-in details.
   * @returns {Observable<object>} Observable with the result of sign-in operation.
   */
  signIn(data: object): Observable<object> {
    return this.authService.send({ cmd: 'sign-in' }, data);
  }

  /**
   * Sends sign-up request to the authentication microservice.
   *
   * @param {object} data Data object containing sign-up details.
   * @returns {Observable<object>} Observable with the result of sign-up operation.
   */
  signUp(data: object): Observable<object> {
    return this.authService.send({ cmd: 'sign-up' }, data);
  }

  /**
   * Sends token validation request to the authentication microservice.
   *
   * @param {object} data Data object containing token to be validated.
   * @returns {Observable<object>} Observable with the result of token validation operation.
   */
  validateToken(data: object): Observable<object> {
    return this.authService.send({ cmd: 'validate-token' }, data);
  }

  /**
   * Sends token refresh request to the authentication microservice.
   *
   * @param {object} data Data object containing refresh token.
   * @returns {Observable<object>} Observable with the result of token refresh operation.
   */
  refreshToken(data: object): Observable<object> {
    return this.authService.send({ cmd: 'refresh-token' }, data);
  }
}
