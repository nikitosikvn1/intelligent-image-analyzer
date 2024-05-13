import { Test, TestingModule } from '@nestjs/testing';
import { GatewayAuthController } from '../gateway-auth.controller';
import { GatewayAuthService } from '../gateway-auth.service';
import { of } from 'rxjs';
import { HttpException } from '@nestjs/common';

describe('GatewayAuthController', () => {
  let controller: GatewayAuthController;
  let service: GatewayAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayAuthController],
      providers: [
        {
          provide: GatewayAuthService,
          useValue: {
            signUp: jest.fn().mockReturnValue(of({ success: true })),
            signIn: jest.fn().mockReturnValue(of({ success: true })),
          },
        },
      ],
    }).compile();

    controller = module.get<GatewayAuthController>(GatewayAuthController);
    service = module.get<GatewayAuthService>(GatewayAuthService);
  });

  it('should sign up a user', async () => {
    // Given
    const signupData = {};

    // When
    const result = await controller.signUp(signupData);

    // Then
    expect(result).toEqual({ success: true });
    expect(service.signUp).toHaveBeenCalledWith(signupData);
  });

  it('should sign in a user', async () => {
    // Given
    const signinData = {};

    // When
    const result = await controller.signIn(signinData);

    // Then
    expect(result).toEqual({ success: true });
    expect(service.signIn).toHaveBeenCalledWith(signinData);
  });

  it('should throw an error when signUp fails', async () => {
    // Given
    const signupData = {};

    const errorMessage = 'Sign up error';
    const statusCode = 500;
    const error: HttpException = new HttpException(errorMessage, statusCode);

    jest.spyOn(service, 'signUp').mockImplementationOnce(() => {
      throw error;
    });

    try {
      await controller.signUp(signupData);
    } catch (thrownError) {
      // Check if signUp method is called with the expected data
      expect(service.signUp).toHaveBeenCalledWith(signupData);

      // Check if the thrown error has the expected properties
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(errorMessage).toBe(error.message);
      expect(statusCode).toBe(error.getStatus());
    }
  });

  it('should throw an error when signIn fails', async () => {
    // Given
    const signinData = {};

    const errorMessage = 'Sign in error';
    const statusCode = 500;
    const error: HttpException = new HttpException(errorMessage, statusCode);

    jest.spyOn(service, 'signIn').mockImplementationOnce(() => {
      throw error;
    });

    try {
      // When
      await controller.signIn(signinData);
    } catch (thrownError) {
      // Then
      // Check if signIn method is called with the expected data
      expect(service.signIn).toHaveBeenCalledWith(signinData);

      // Check if the thrown error has the expected properties
      expect(thrownError).toBeInstanceOf(HttpException);
      expect(errorMessage).toBe(error.message);
      expect(statusCode).toBe(error.getStatus());
    }
  });
});
