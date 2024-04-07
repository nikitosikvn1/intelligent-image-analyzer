import { Controller, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SignUpDto, SignInDto, JwtDto, SignUpResultDto, SignInResultDto, JwtResultDto } from './dto/';
import { RpcValidationFilter } from './filters/rpc.validation.filter';

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
   * }).then(result => console.log(result)); // Expected result: { status: 'success', message: 'JWT has been generated', token: '...' }
   * 
   * @async
   * @param {SignInDto} dto User sign-in data.
   * @returns {Promise<SignInResultDto>} Login result.
   */
  @MessagePattern({ cmd: 'sign-in' })
  @UsePipes(ValidationPipe)
  async singIn(@Payload() dto: SignInDto): Promise<SignInResultDto> {
    return await this.authService.signIn(dto);
  }

  /**
   * Validates a JWT token by processing validation requests.
   * 
   * @example 
   * // validateToken method usage:
   * validateToken({
   *   token: 'jwt.token.here'
   * }).then(result => console.log(result)); // Result: { isValid: true, message: 'Token is valid' }
   * 
   * @async
   * @param {JwtDto} dto JWT data for validation.
   * @returns {Promise<JwtResultDto>} Token validation result.
   */
  @MessagePattern({ cmd: 'validate-token' })
  @UsePipes(ValidationPipe)
  async validateToken(@Payload() dto: JwtDto): Promise<JwtResultDto> {
    return this.authService.validateToken(dto);
  }
}
