import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignUpDto, SignInDto, JwtDto, SignUpResultDto, SignInResultDto, JwtResultDto } from './dto';
import { User } from './entities/user.entity';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/**
 * AuthService handles user authentication processes like registration, login, and JWT token validation. 
 * It uses TypeORM for interacting with the database and bcrypt for hashing passwords.
 *
 * @Injectable Decorator signifies that Nest can instantiate AuthService automatically where needed, enabling dependency injection for modular and testable code.
 */
@Injectable()
export class AuthService {
  /**
  * Initializes AuthService with necessary dependencies.
  * 
  * @param {Repository<User>} userRepository Injected TypeORM repository for accessing user data.
  * @param {JwtService} jwtService Injected service for handling JWT operations, such as token generation and verification.
  */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) { }

  /**
   * Registers a new user with the given sign-up details.
   * 
   * @example
   * // signUp usage:
   * const signUpResult = await authService.signUp({
   *   firstname: 'FirstName',
   *   lastname: 'LastName',
   *   email: 'email@gmail.com,
   *   password: 'StrongPassword123!'
   * });
   * console.log(signUpResult); // Expected result: { status: 'success', message: 'User has been registered' }
   * 
   * @async
   * @param {SignUpDto} dto The data transfer object containing the sign-up details.
   * @returns {Promise<SignUpResultDto>} A result object indicating the status of the registration.
   * @throws {ConflictException} If a user with the same email already exists.
   */
  async signUp(dto: SignUpDto): Promise<SignUpResultDto> {
    const user = await this.userRepository.findOneBy({ email: dto.email });

    if (user) {
      throw new ConflictException('User with such email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newUser = this.userRepository.create({
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);
    return {
      status: 'success',
      message: 'User has been registered',
    };
  }

  /**
   * Authenticates a user based on email and password, generating a JWT if successful.
   * 
   * @example
   * // signIn usage:
   * const signInResult = await authService.signIn({
   *   email: 'email@gmail.com',
   *   password: 'StrongPassword123!'
   * });
   * console.log(signInResult); // Expected result: { status: 'success', message: 'JWT has been generated', token: '...' }
   * 
   * @async
   * @param {SignInDto} dto The data transfer object containing the sign-in credentials.
   * @returns {Promise<SignInResultDto>} A result object containing the JWT if authentication is successful.
   * @throws {ConflictException} If the email does not exist or the password is incorrect.
   */
  async signIn(dto: SignInDto): Promise<SignInResultDto> {
    const user = await this.userRepository.findOneBy({ email: dto.email });

    if (!user) {
      throw new ConflictException('User with such email does not exist');
    }

    const isPasswordCorrect = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordCorrect) {
      throw new ConflictException('Password is incorrect');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      status: 'success',
      message: 'JWT has been generated',
      token: accessToken,
    };
  }

  /**
   * Validates a JWT token.
   * 
   * @example
   * // validateToken usage:
   * const validationResult = await authService.validateToken({ token: 'jwt.token.here' });
   * console.log(validationResult); // Expected results: { isValid: true, message: 'Token is valid' } or { isValid: false, message: 'Token expired' | 'Invalid token' }
   * 
   * @async
   * @param {JwtDto} dto The data transfer object containing the JWT token to be validated.
   * @returns {Promise<JwtResultDto>} A result object indicating the validity of the token.
   */
  async validateToken(dto: JwtDto): Promise<JwtResultDto> {
    try {
      this.jwtService.verify(dto.token);
      return {
        isValid: true,
        message: 'Token is valid',
      };
    } catch (err) {
      return {
        isValid: false,
        message: this.getTokenErrorMessage(err),
      };
    }
  }

  /**
   * Determines the appropriate error message for a JWT validation error.
   * 
   * @private
   * @param {TokenExpiredError | JsonWebTokenError} err The error encountered during JWT validation.
   * @returns {string} A user-friendly error message.
   */
  private getTokenErrorMessage(err: TokenExpiredError | JsonWebTokenError): string {
    if (err instanceof TokenExpiredError) {
      return 'Token expired';
    } else if (err instanceof JsonWebTokenError) {
      return 'Invalid token';
    } else {
      return 'Token verification failed';
    }
  }
}
