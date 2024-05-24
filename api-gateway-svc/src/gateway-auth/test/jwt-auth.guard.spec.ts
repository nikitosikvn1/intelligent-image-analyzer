import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GatewayAuthService } from '../gateway-auth.service';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { of } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: GatewayAuthService;
  let rateLimiter: RateLimiterMemory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: GatewayAuthService,
          useValue: {
            validateToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    authService = module.get<GatewayAuthService>(GatewayAuthService);

    rateLimiter = new RateLimiterMemory({ points: 3, duration: 3600 });
    guard['rateLimiter'] = rateLimiter; // Override the rateLimiter for test isolation.
  });

  it('should allow request with a valid JWT token', async () => {
    // Given
    const mockExecutionContext = createMockExecutionContext('valid-token');
    jest
      .spyOn(authService, 'validateToken')
      .mockReturnValue(of({ isValid: true }));

    // When
    const result = await guard.canActivate(mockExecutionContext);

    // Then
    expect(result).toBe(true);
    expect(authService.validateToken).toHaveBeenCalledWith({
      token: 'valid-token',
    });
  });

  it('should not allow request with an invalid JWT token', async () => {
    // Given
    const mockExecutionContext = createMockExecutionContext('invalid-token');
    jest
      .spyOn(authService, 'validateToken')
      .mockReturnValue(of({ isValid: false }));

    // When
    const result = await guard.canActivate(mockExecutionContext);

    // Then
    await expect(result).toBe(false);
    expect(authService.validateToken).toHaveBeenCalledWith({
      token: 'invalid-token',
    });
  });

  it('should apply rate limiting for requests without JWT token', async () => {
    // Given
    const mockExecutionContext = createMockExecutionContext();
    jest.spyOn(rateLimiter, 'consume').mockResolvedValue({
      remainingPoints: 2,
      msBeforeNext: 1000,
      consumedPoints: 1,
      isFirstInDuration: false,
      toJSON: () => {},
    } as RateLimiterRes);

    // When
    const result = await guard.canActivate(mockExecutionContext);

    // Then
    expect(result).toBe(true);
  });

  it('should throw an error when rate limit is exceeded', async () => {
    // Given
    const mockExecutionContext = createMockExecutionContext();
    jest
      .spyOn(rateLimiter, 'consume')
      .mockRejectedValue({ remainingPoints: 0 });

    // When & Then
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      HttpException,
    );
  });

  it('should throw an error if token validation fails', async () => {
    // Given
    const mockExecutionContext = createMockExecutionContext('invalid-token');
    const error = new Error('Token validation error');

    jest.spyOn(authService, 'validateToken').mockImplementation(() => {
      throw error;
    });

    // When & Then
    await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
      error,
    );

    expect(authService.validateToken).toHaveBeenCalledWith({
      token: 'invalid-token',
    });
  });

  function createMockExecutionContext(token?: string): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: token ? { token } : {},
          ip: '127.0.0.1',
        }),
      }),
    } as unknown as ExecutionContext;
  }
});
