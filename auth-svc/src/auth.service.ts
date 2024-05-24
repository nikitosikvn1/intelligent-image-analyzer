import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignUpDto, JwtGenerationDto, JwtDto, SignUpResultDto, JwtGenerationResultDto, JwtValidationResultDto } from './dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { NotRefreshTokenError, NotAccessTokenError } from './exceptions';
import * as bcrypt from 'bcrypt';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

/**
 * AuthService handles user authentication processes like registration, login, and JWT token validation. 
 * It uses TypeORM for interacting with the database and bcrypt for hashing passwords.
 *
 * @Injectable Decorator signifies that Nest can instantiate AuthService automatically where needed, enabling dependency injection for modular and testable code.
 */
@Injectable()
export class AuthService {
  /**
   * Time-to-live (TTL) for the refresh token cache, in milliseconds.
   */
  private readonly JWT_REFRESH_TTL = 1000 * 60 * 60 * 24; // 24 hours

  /**
  * Initializes AuthService with necessary dependencies.
  * 
  * @param {Repository<User>} userRepository Injected TypeORM repository for accessing user data.
  * @param {JwtService} jwtService Injected service for handling JWT operations, such as token generation and verification.
  */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
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
   * console.log(signInResult); // Expected result: { accessToken, refreshToken }
   * 
   * @async
   * @param {JwtGenerationDto} dto The data transfer object containing the sign-in credentials.
   * @returns {Promise<JwtGenerationResultDto>} A result object containing the JWT.
   * @throws {ConflictException} If user with such email does not exist or the password is incorrect.
   */
  async signIn(dto: JwtGenerationDto): Promise<JwtGenerationResultDto> {
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
    const refreshToken = this.jwtService.sign({ isRefreshToken: true, ...payload }, { expiresIn: '1d' });

    const jwts: JwtGenerationResultDto = {
      accessToken,
      refreshToken,
    };

    // Store tokens in the cache
    const cachedTokens: string = await this.cacheManager.get(user.email);
    if (cachedTokens) {
      await this.cacheManager.del(user.email);
    }
    await this.cacheManager.set(user.email, jwts, this.JWT_REFRESH_TTL);

    return jwts;
  }

  /**
   * Refreshes both access and potentially the refresh token using a valid refresh token.
   * This method ensures that the provided token is specifically a refresh token and not just any JWT,
   * by verifying a designated flag in the token's payload. It then issues new tokens accordingly.
   *
   * @example
   * // refreshToken usage:
   * const refreshTokenResult = await authService.refreshToken({
   *  token: 'refresh.token.jwt'
   * });
   * console.log(refreshTokenResult); // Expected result: { accessToken, refreshToken } or { isValid: false, message: ... }
   * 
   * @param {JwtDto} dto The data transfer object containing the refresh token.
   * @returns {Promise<JwtGenerationResultDto | JwtValidationResultDto>} A result object containing the new JWTs.
   */
  async refreshToken(dto: JwtDto): Promise<JwtGenerationResultDto | JwtValidationResultDto> {
    try {
      const oldPayload = this.jwtService.verify(dto.token);

      // Retrieve the refresh token from the cache
      const oldCachedTokens: JwtGenerationResultDto = await this.cacheManager.get(oldPayload.email);
      const oldCachedRefreshToken: string = oldCachedTokens.refreshToken;

      const oldCachedPayload = this.jwtService.verify(oldCachedRefreshToken);

      // Ensure the token is a refresh token
      if (!oldCachedRefreshToken || !oldCachedPayload.isRefreshToken || oldCachedRefreshToken !== dto.token) {
        throw new NotRefreshTokenError();
      }

      // Delete the old refresh token from the cache
      await this.cacheManager.del(oldCachedPayload.email);

      const payload = { email: oldCachedPayload.email, sub: oldCachedPayload.sub };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '12h' });
      const refreshToken = this.jwtService.sign({ isRefreshToken: true, ...payload }, { expiresIn: '1d' });

      const jwts: JwtGenerationResultDto = {
        accessToken,
        refreshToken,
      };

      // Store the new refresh token in the cache
      const cachedJwts: string = await this.cacheManager.get(oldCachedPayload.email);
      if (cachedJwts) {
        await this.cacheManager.del(oldCachedPayload.email);
      }
      await this.cacheManager.set(oldCachedPayload.email, jwts, this.JWT_REFRESH_TTL);

      return jwts;
    } catch (err) {
      return {
        isValid: false,
        message: this.getTokenErrorMessage(err),
      };
    }
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
   * @returns {Promise<JwtValidationResultDto>} A result object indicating the validity of the token.
   */
  async validateToken(dto: JwtDto): Promise<JwtValidationResultDto> {
    try {
      const payload = this.jwtService.verify(dto.token);
      const cachedTokens: JwtGenerationResultDto = await this.cacheManager.get(payload.email);
      const cachedAccessToken: string = cachedTokens.accessToken;

      if (payload.isRefreshToken || cachedAccessToken !== dto.token) {
        throw new NotAccessTokenError();
      }

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
   * Determines the appropriate error message for a JWT validation error based on the specific type of JWT error encountered.
   *
   * @example
   * // getTokenErrorMessage usage:
   * const errorMessage = getTokenErrorMessage(new TokenExpiredError());
   * console.log(errorMessage); // Expected result: 'Token expired'
   * 
   * @private
   * @param {Error} err The error encountered during JWT validation, which can be one of several types defined in the JWT handling strategy.
   * @returns {string} A user-friendly error message tailored to the specific error, enhancing error feedback in client interactions.
   */
  private getTokenErrorMessage(err: Error): string {
    const errorMessages: { [key: string]: string } = {
      'TokenExpiredError': 'Token expired',
      'JsonWebTokenError': 'Invalid token',
      'NotRefreshTokenError': err.message,
      'NotAccessTokenError': err.message,
    };

    return errorMessages[err.name] || 'Token verification failed';
  }
}
