import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { JwtDto, JwtGenerationDto, JwtGenerationResultDto, JwtValidationResultDto, SignUpDto, SignUpResultDto } from '../dto';
import { ConflictException } from '@nestjs/common';
import { VerificationDataDto } from 'src/dto/verification-data.dto';
import { MailService } from '../../mail/mail.service';
import { VerificationKeyDto } from '../dto/verification-key.dto';

describe('AuthController', () => {
  type CachedTokens = {
    [key: string]: JwtGenerationResultDto;
  }

  type CachedsendedEmails = {
    [key: string]: string;
  }

  type Users = {
    [key: string]: User;
  }

  let userCounter = 0;
  let authController: AuthController;
  let userRepository: Repository<User>;
  let users: Users = {};
  let jwt: JwtGenerationResultDto = {
    accessToken: '',
    refreshToken: '',
  };
  let cachedData: CachedTokens | CachedsendedEmails = {};
  let sendedEmails = {};

  const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            save: jest.fn(async (user: User) => {
              user.id = userCounter;
              userCounter++;
              users[user.email] = user;
              return user;
            }),
            create: jest.fn((user: User) => user),
            findOneBy: jest.fn(async ({ email }) => users[email]),
            update: jest.fn((id: number, data: object) => {
              const user: User = Object.values(users).find((user: User) => user.id === id);
              if (user) {
                Object.assign(user, data);
              }
              return user;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload) => {
              const tokenType = payload.isRefreshToken ? 'refreshToken' : 'accessToken';
              const tokenSuffix = payload.isRefreshToken ? 'refresh-token' : 'access-token';
              let token = jwt[tokenType];

              // Check if token already exists and update or generate a new one accordingly
              if (token !== '') {
                // If update existing token
                token += '-refreshed';
              } else {
                // If generate new token
                token = `new-${tokenSuffix}`;
              }

              jwt[tokenType] = token;
              return token;
            }),
            verify: jest.fn((token) => {
              // Check if token expired
              if (token === 'expired.token.jwt') {
                throw new TokenExpiredError('Token has expired', new Date());
              }

              // Generic invalid token handling
              if (token.startsWith('invalid')) {
                throw new JsonWebTokenError('Invalid token');
              }

              // Construct the default valid payload and adjust based on the token type
              const isRefreshToken = token.startsWith('new-refresh-token');
              return {
                isRefreshToken: isRefreshToken,
                email: 'example@gmail.com',
                sub: '1',
                isValid: true
              };
            }),
          }
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: {
            get: async (key: string) => cachedData[key],
            set: async (key: string, value: JwtGenerationResultDto | string) => {
              cachedData[key] = value;
            },
            del: async (key: string) => {
              delete cachedData[key];
            },
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationMail: (dto: VerificationDataDto) => {
              sendedEmails[dto.resiverEmail] = dto.key;
            },
          }
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    userRepository = module.get<Repository<User>>(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    users = {};
    jwt = {
      accessToken: '',
      refreshToken: '',
    };
    cachedData = {};
    sendedEmails = {};
    userCounter = 0;
  });

  describe('signUp', () => {
    it('should register a new user, hash the password and send verefication email', async () => {
      // Given
      const bcryptHashLength = 60;

      const inputDto: SignUpDto = {
        firstname: 'John',
        lastname: 'KowalskiUfuqfhq231',
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      const resultDto: SignUpResultDto = {
        status: 'success',
        message: 'User has been registered. Please verify your account by clicking the link sent to your email.',
      };

      // When
      const result = await authController.signUp(inputDto);
      const user = users[inputDto.email];

      // Then
      expect(result).toEqual(resultDto);
      expect(user).toBeDefined();
      expect(user.password.length).toBe(bcryptHashLength);
      expect(Object.keys(cachedData).length).toBeGreaterThan(0);
      expect(Object.keys(sendedEmails).length).toBeGreaterThan(0);
    });

    it('should throw an error if user with the same email already exists', async () => {
      // Given
      const errMessage = 'User with such email already exists';

      const inputDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski',
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      // When
      await authController.signUp(inputDto);

      // Then
      await expect(authController.signUp(inputDto)).rejects.toThrow(new ConflictException(errMessage));
    });
  });

  describe('verifyUser', () => {
    const SignUpDto: SignUpDto = {
      firstname: 'John',
      lastname: 'KowalskiUfuqfhq231',
      email: 'example@gmail.com',
      password: 'StrongPassword123!',
    };

    it('should verify user account if key is valid', async () => {
      // Given      
      const expectedResult = {
        status: 'success',
        message: 'User has been verified',
      };

      await authController.signUp(SignUpDto);

      const verificationKeyDto: VerificationKeyDto = {
        key: sendedEmails[SignUpDto.email],
      };

      // When
      const result = await authController.verifyUser(verificationKeyDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
      expect(Object.keys(cachedData).length).toBe(0);
      expect(users[SignUpDto.email].isVerified).toBeTruthy();
    });

    it('should indicate key is invalid when provided invalid verification key', async () => {
      // Given
      const expectedResult = {
        status: 'error',
        message: 'Invalid verification key',
      };

      const invalidVerificationKeyDto: VerificationKeyDto = {
        key: 'invalid-key',
      };

      // When
      const result = await authController.verifyUser(invalidVerificationKeyDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate verification key is invalid when user does not exist', async () => {
      // Given
      const expectedResult = {
        status: 'error',
        message: 'User with such email does not exist',
      };

      await authController.signUp(SignUpDto);

      const invalidKey: VerificationKeyDto = {
        key: sendedEmails[SignUpDto.email],
      };

      users[SignUpDto.email] = undefined;

      // When
      const result = await authController.verifyUser(invalidKey);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate verification key is invalid when user is already verified', async () => {
      // Given
      const expectedResult = {
        status: 'error',
        message: 'User is already verified',
      };

      await authController.signUp(SignUpDto);

      const verificationKeyDto: VerificationKeyDto = {
        key: sendedEmails[SignUpDto.email],
      };

      users[SignUpDto.email].isVerified = true;

      // When
      const result = await authController.verifyUser(verificationKeyDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('signIn', () => {
    it('should return a JWT if authentication is successful', async () => {
      // Given
      const signUpDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski',
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      const signInDto: JwtGenerationDto = {
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      const expectedResult: JwtGenerationResultDto = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      // When
      await authController.signUp(signUpDto);

      const result = await authController.signIn(signInDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should throw an error if user with the given email does not exist', async () => {
      // Given
      const errMessage = 'User with such email does not exist';

      const inputDto: JwtGenerationDto = {
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      // Then
      await expect(authController.signIn(inputDto)).rejects.toThrow(new ConflictException(errMessage));
    });

    it('should throw an error if password is incorrect', async () => {
      // Given
      const errMessage = 'Password is incorrect';

      const signUpDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski',
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      const signInDto: JwtGenerationDto = {
        email: 'example@gmail.com',
        password: 'WrongPassword!32',
      };

      // When
      await authController.signUp(signUpDto);

      // Then
      await expect(authController.signIn(signInDto)).rejects.toThrow(new ConflictException(errMessage));
    });
  });

  describe('validateToken', () => {
    const signUpDto: SignUpDto = {
      firstname: 'John',
      lastname: 'Kowalski',
      email: 'example@gmail.com',
      password: 'StrongPassword123!',
    };

    const signInDto: JwtGenerationDto = {
      email: 'example@gmail.com',
      password: 'StrongPassword123!',
    };

    it('should confirm token validity when provided a valid access JWT', async () => {
      // Given
      const expectedResult: JwtValidationResultDto = {
        isValid: true,
        message: 'Token is valid',
      };

      // When
      await authController.signUp(signUpDto);
      const jwtGenResult: JwtGenerationResultDto = await authController.signIn(signInDto);
      const jwtAccessToken: JwtDto = { token: jwtGenResult.accessToken };

      const result = await authController.validateToken(jwtAccessToken);

      // Then
      expect(result).toBeDefined();
      expect(jwtAccessToken.token).toEqual(jwtGenResult.accessToken);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate token is invalid when pass access token after using refresh token', async () => {
      // Given
      const expectedResult: JwtValidationResultDto = {
        isValid: false,
        message: 'Provided token is not an access token',
      };

      // When
      await authController.signUp(signUpDto);
      const jwtGenResult: JwtGenerationResultDto = await authController.signIn(signInDto);
      const jwtRefreshToken: JwtDto = { token: jwtGenResult.refreshToken };

      await authController.refreshToken(jwtRefreshToken);
      const jwtAccessToken: JwtDto = { token: jwtGenResult.accessToken };

      const result = await authController.validateToken(jwtAccessToken);

      // Then
      expect(result).toBeDefined();
      expect(jwtAccessToken.token).not.toEqual(jwt.accessToken);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate token is invalid when provided refresh JWT', async () => {
      // Given
      const expectedResult: JwtValidationResultDto = {
        isValid: false,
        message: 'Provided token is not an access token',
      };

      // When
      await authController.signUp(signUpDto);
      const jwtGenResult: JwtGenerationResultDto = await authController.signIn(signInDto);
      const jwtRefreshToken: JwtDto = { token: jwtGenResult.refreshToken };

      const result = await authController.validateToken(jwtRefreshToken);

      // Then
      expect(result).toBeDefined();
      expect(jwtRefreshToken.token).toEqual(jwtGenResult.refreshToken);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate token is invalid when provided a faulty JWT', async () => {
      // Given
      const jwtDto: JwtDto = {
        token: 'invalid.token.jwt',
      };

      const expectedResult: JwtValidationResultDto = {
        isValid: false,
        message: 'Invalid token',
      };

      // When
      await authController.signUp(signUpDto);
      await authController.signIn(signInDto);

      const result = await authController.validateToken(jwtDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate token is invalid when provided an expired JWT token', async () => {
      // Given
      const jwtDto: JwtDto = {
        token: 'expired.token.jwt',
      };

      const expectedResult = {
        isValid: false,
        message: 'Token expired',
      };

      // When
      const result = await authController.validateToken(jwtDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('refreshToken', () => {
    const signUpDto: SignUpDto = {
      firstname: 'John',
      lastname: 'Kowalski',
      email: 'example@gmail.com',
      password: 'StrongPassword123!',
    };

    const signInDto: JwtGenerationDto = {
      email: 'example@gmail.com',
      password: 'StrongPassword123!',
    };

    it('should return a new JWT pair when provided a valid refresh token', async () => {
      // Given
      const expectedResult: JwtGenerationResultDto = {
        accessToken: 'new-access-token-refreshed',
        refreshToken: 'new-refresh-token-refreshed',
      };

      // When
      await authController.signUp(signUpDto);
      const jwtGenResult: JwtGenerationResultDto = await authController.signIn(signInDto);
      const jwtRefreshToken: JwtDto = { token: jwtGenResult.refreshToken };

      const result = await authController.refreshToken(jwtRefreshToken);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should return valid access and refresh tokens after using refresh token', async () => {
      // Given
      const expectedAccessResult: JwtValidationResultDto = {
        isValid: true,
        message: 'Token is valid',
      };

      const expectedRefreshResult: JwtGenerationResultDto = {
        accessToken: "new-access-token-refreshed-refreshed",
        refreshToken: "new-refresh-token-refreshed-refreshed",
      };

      // When
      await authController.signUp(signUpDto);
      const jwtGenResult: JwtGenerationResultDto = await authController.signIn(signInDto);

      const jwtRefreshToken: JwtDto = { token: jwtGenResult.refreshToken };
      const refreshedGenResult = await authController.refreshToken(jwtRefreshToken);

      // Then
      expect(refreshedGenResult).toBeDefined();
      expect(refreshedGenResult).not.toStrictEqual(jwtGenResult);
      expect(refreshedGenResult).toStrictEqual(jwt);

      if ('accessToken' in refreshedGenResult && 'refreshToken' in refreshedGenResult) {
        const refreshedAccessToken: JwtDto = { token: refreshedGenResult.accessToken };
        const refreshedRefreshToken: JwtDto = { token: refreshedGenResult.refreshToken };

        // Check refreshed tokens for their workability
        expect(await authController.validateToken(refreshedAccessToken)).toStrictEqual(expectedAccessResult);
        expect(await authController.refreshToken(refreshedRefreshToken)).toStrictEqual(expectedRefreshResult);
      } else {
        throw new Error('Invalid return type');
      }
    });

    it('should indicate token is invalid after using refresh token', async () => {
      // Given
      const expectedResult: JwtValidationResultDto = {
        isValid: false,
        message: 'Provided token is not a refresh token',
      };

      // When
      await authController.signUp(signUpDto);
      const jwtGenResult: JwtGenerationResultDto = await authController.signIn(signInDto);
      const jwtRefreshToken: JwtDto = { token: jwtGenResult.refreshToken };

      await authController.refreshToken(jwtRefreshToken);
      const result = await authController.refreshToken(jwtRefreshToken);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
      expect(jwtGenResult).not.toEqual(jwt);
    });

    it('should indicate token is not refresh token', async () => {
      // Given
      const expectedResult: JwtValidationResultDto = {
        isValid: false,
        message: 'Provided token is not a refresh token',
      };

      // When
      await authController.signUp(signUpDto);
      const jwtGenResult: JwtGenerationResultDto = await authController.signIn(signInDto);
      const jwtAccessToken: JwtDto = { token: jwtGenResult.accessToken };

      const result = await authController.refreshToken(jwtAccessToken);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate token is invalid', async () => {
      // Given
      const jwtDto: JwtDto = {
        token: 'invalid.token.jwt',
      };

      const expectedResult: JwtValidationResultDto = {
        isValid: false,
        message: 'Invalid token',
      };

      // When
      const result = await authController.refreshToken(jwtDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });

    it('should indicate token is expired', async () => {
      // Given
      const jwtDto: JwtDto = {
        token: 'expired.token.jwt',
      };

      const expectedResult: JwtValidationResultDto = {
        isValid: false,
        message: 'Token expired',
      };

      // When
      const result = await authController.refreshToken(jwtDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
