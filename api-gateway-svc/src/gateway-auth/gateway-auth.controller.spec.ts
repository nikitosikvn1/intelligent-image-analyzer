import { Test, TestingModule } from '@nestjs/testing';
import { GatewayAuthController } from './gateway-auth.controller';
import { GatewayAuthService } from './gateway-auth.service';
import { lastValueFrom, of } from 'rxjs';

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
            validateToken: jest.fn().mockReturnValue(of({ isValid: true })),
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
    const result = await lastValueFrom(await controller.signUp(signupData));

    // Then
    expect(result).toEqual({ success: true });
    expect(service.signUp).toHaveBeenCalledWith(signupData);
  });

  it('should sign in a user', async () => {
    // Given
    const signinData = {};

    // When
    const result = await lastValueFrom(await controller.signIn(signinData));

    // Then
    expect(result).toEqual({ success: true });
    expect(service.signIn).toHaveBeenCalledWith(signinData);
  });

  it('should validate a token', async () => {
    // Given
    const tokenData = '';

    // When
    const result = await controller.validateToken(tokenData);

    // Then
    expect(result).toEqual({ isValid: true });
    expect(service.validateToken).toHaveBeenCalledWith({ token: tokenData });
  });
});
