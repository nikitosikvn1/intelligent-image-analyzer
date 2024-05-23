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
            refreshToken: jest.fn().mockReturnValue(of({ success: true })),
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

  it('should refresh a jwt token', async () => {
    // Given
    const refreshData = {};

    // When
    const result = await controller.refreshToken(refreshData);

    // Then
    expect(result).toEqual({ success: true });
    expect(service.refreshToken).toHaveBeenCalledWith(refreshData);
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

    // When
    const result = controller.signUp(signupData);

    //Then
    await expect(result).rejects.toThrow(error);
    expect(service.signUp).toHaveBeenCalledWith(signupData);
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

    // When
    const result = controller.signIn(signinData);

    // Then
    await expect(result).rejects.toThrow(error);
    expect(service.signIn).toHaveBeenCalledWith(signinData);
  });

  it('should throw an error when refresh token fails', async () => {
    // Given
    const refreshData = {};

    const errorMessage = 'Refresh token error';
    const statusCode = 500;
    const error: HttpException = new HttpException(errorMessage, statusCode);

    jest.spyOn(service, 'refreshToken').mockImplementationOnce(() => {
      throw error;
    });

    // When
    const result = controller.refreshToken(refreshData);

    // Then
    await expect(result).rejects.toThrow(error);
    expect(service.refreshToken).toHaveBeenCalledWith(refreshData);
  });
});
