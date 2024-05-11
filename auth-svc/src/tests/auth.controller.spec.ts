import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { JwtDto, SignInDto, SignInResultDto, SignUpDto, SignUpResultDto } from '../dto';
import { ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let userRepository: Repository<User>;
  let users = {};
  let jwtToken: string;

  const USER_REPOSITORY_TOKEN = getRepositoryToken(User);

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService,
        {
          provide: USER_REPOSITORY_TOKEN,
          useValue: {
            save: async (user: User): Promise<User> => {
              users[user.email] = user;
              return user;
            },
            create: (user: User): User => user,
            findOneBy: async (options: { email: string }): Promise<User> | undefined => users[options.email],
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: (payload: SignInDto) => {
              jwtToken = 'JWT';
              return jwtToken;
            },
            verify: (token: string) => {
              if (token === 'expired.token.jwt') {
                throw new TokenExpiredError('Token has expired', new Date());
              } else if (token !== jwtToken) {
                throw new JsonWebTokenError('Invalid token');
              }
              return { isValid: true };
            },
          }
        }
      ],
    }).compile();

    authController = app.get<AuthController>(AuthController);
    userRepository = app.get<Repository<User>>(USER_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    users = {};
    jwtToken = '';
  });

  describe('signUp', () => {
    it('should register a new user and hash the password', async () => {
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
        message: 'User has been registered',
      };

      // When
      const result = await authController.signUp(inputDto);
      const user = users[inputDto.email];

      // Then
      expect(result).toEqual(resultDto);
      expect(user).toBeDefined();
      expect(user.password.length).toBe(bcryptHashLength);
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

  describe('signIn', () => {
    it('should return a JWT if authentication is successful', async () => {
      // Given
      const signUpDto: SignUpDto = {
        firstname: 'John',
        lastname: 'Kowalski',
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      const signInDto: SignInDto = {
        email: 'example@gmail.com',
        password: 'StrongPassword123!',
      };

      const resultDto: SignInResultDto = {
        status: 'success',
        message: 'JWT has been generated',
        token: 'JWT',
      };

      // When
      await authController.signUp(signUpDto);

      const result = await authController.signIn(signInDto);

      // Then
      expect(result).toBeDefined();
      expect(result).toStrictEqual(resultDto);
    });

    it('should throw an error if user with the given email does not exist', async () => {
      // Given
      const errMessage = 'User with such email does not exist';

      const inputDto: SignInDto = {
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

      const signInDto: SignInDto = {
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

    const signInDto: SignInDto = {
      email: 'example@gmail.com',
      password: 'StrongPassword123!',
    };

    it('should confirm token validity when provided a valid JWT', async () => {
      // Given
      const expectedJWT: string = 'JWT';

      const resultDto = {
        isValid: true,
        message: 'Token is valid',
      };

      // When
      await authController.signUp(signUpDto);
      const jwtDto: JwtDto = await authController.signIn(signInDto);
      const result = await authController.validateToken(jwtDto);

      // Then
      expect(result).toBeDefined();
      expect(jwtToken).toBe(expectedJWT);
      expect(result).toStrictEqual(resultDto);
    });

    it('should indicate token is invalid when provided a faulty JWT', async () => {
      // Given
      const jwtDto = {
        token: 'invalid.token.jwt',
      };

      const resultDto = {
        isValid: false,
        message: 'Invalid token',
      };

      // When
      await authController.signUp(signUpDto);
      await authController.signIn(signInDto);

      const result = await authController.validateToken(jwtDto);

      // Then
      expect(result).toBeDefined();
      expect(jwtDto.token).not.toBe(jwtToken);
      expect(result).toStrictEqual(resultDto);
    });

    it('should handle expired JWT token', async () => {
      // Given
      const jwtToken = 'expired.token.jwt';

      const resultDto = {
        isValid: false,
        message: 'Token expired',
      };

      // When
      const result = await authController.validateToken({ token: jwtToken });
      
      // Then
      expect(result).toStrictEqual(resultDto);
    });
  });
});
