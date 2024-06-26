import { Controller, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SignUpDto, JwtGenerationDto, JwtDto, SignUpResultDto, JwtGenerationResultDto, JwtValidationResultDto, JwtRefreshFailureResultDto } from './dto/';
import { RpcValidationFilter } from './filters/rpc.validation.filter';
import { VerificationKeyDto } from './dto/verification-key.dto';

/**
 * Defines authentication-related routing handlers. Processes sign-up, sign-in, and token validation
 * requests through RabbitMQ messages, leveraging RPC style messaging for asynchronous communication.
 * 
 * @class
 * @Controller Marks the class as a route handler.
 * @UseFilters Applies RpcValidationFilter for enhanced error handling.
 */
@UseFilters(new RpcValidationFilter())
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Facilitates user registration by validating and processing sign-up requests.
   * 
   * @example
   * // signUp method usage:
   * signUp({
   *   firstname: 'FirstName',
   *   lastname: 'LastName',
   *   email: 'email@gmail.com',
   *   password: 'StrongPassword123!'
   * }).then(result => console.log(result)); // Result: { status: 'success', message: 'User has been registered' }
   * 
   * @async
   * @param {SignUpDto} dto User sign-up data.
   * @returns {Promise<SignUpResultDto>} Registration result.
   */
  @MessagePattern({ cmd: 'sign-up' })
  @UsePipes(ValidationPipe)
  async signUp(@Payload() dto: SignUpDto): Promise<SignUpResultDto> {
    return await this.authService.signUp(dto);
  }

  /**
   * Facilitates user login by validating and processing sign-in requests.
   * 
   * @example
   * // singIn method usage:
   * singIn({
   *   email: 'email@gmail.com',
   *   password: 'StrongPassword123!'
   * }).then(result => console.log(result)); // Expected result: { status: 'success', message: 'JWT has been generated', accessToken '...', refreshToken '...' }
   * 
   * @async
   * @param {SignInDto} dto User sign-in data.
   * @returns {Promise<JwtGenerationResultDto>} Login result.
   */
  @MessagePattern({ cmd: 'sign-in' })
  @UsePipes(ValidationPipe)
  async signIn(@Payload() dto: JwtGenerationDto): Promise<JwtGenerationResultDto> {
    return await this.authService.signIn(dto);
  }

  /**
   * Refreshes a JWT token by processing token refresh requests.
   * 
   * @example
   * // refreshToken method usage:
   * refreshToken
   *  token: 'jwt.token.here'
   * }).then(result => console.log(result)); // Expected result: { status: 'success', message: 'JWT has been refreshed', accessToken '...', refreshToken '...' }
   * 
   * @async
   * @param {JwtDto} dto JWT data for token refresh.
   * @returns {Promise<JwtGenerationResultDto | JwtRefreshFailureResultDto>} Token refresh result or refresh jwt validation failure.
   */
  @MessagePattern({ cmd: 'refresh-token' })
  @UsePipes(ValidationPipe)
  async refreshToken(@Payload() dto: JwtDto): Promise<JwtGenerationResultDto | JwtRefreshFailureResultDto> {
    return await this.authService.refreshToken(dto);
  }

  /**
   * Validates a JWT token by processing validation requests. If the token is valid, it is checked for verification.
   * 
   * @example 
   * // validateToken method usage:
   * validateToken({
   *   token: 'jwt.token.here'
   * }).then(result => console.log(result)); // Result: { isValid: true, isVerified: boolean, message: 'Token is valid' }
   * 
   * @async
   * @param {JwtDto} dto JWT data for validation.
   * @returns {Promise<JwtValidationResultDto>} Token validation result.
   */
  @MessagePattern({ cmd: 'validate-token' })
  @UsePipes(ValidationPipe)
  async validateToken(@Payload() dto: JwtDto): Promise<JwtValidationResultDto> {
    return this.authService.validateToken(dto);
  }

  /**
   * Verifies a user account by processing verification key requests.
   * 
   * @example
   * // verifyUser method usage:
   * verifyUser({
   *   key: 'verification-key-here'
   * }).then(result => console.log(result)); // Result: { status: 'success', message: 'User has been verified' }
   * 
   * @async
   * @param {VerificationKeyDto} dto Verification key in UUID format.
   * @returns {Promise<SignUpResultDto>} Verification result.
   */
  @MessagePattern({ cmd: 'verify-user' })
  @UsePipes(ValidationPipe)
  async verifyUser(@Payload() dto: VerificationKeyDto): Promise<SignUpResultDto> {
    return this.authService.verifyUser(dto);
  }
}
