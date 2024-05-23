import { Test, TestingModule } from '@nestjs/testing';
import { GatewayAuthService } from '../gateway-auth.service';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, of } from 'rxjs';

describe('GatewayAuthService', () => {
  let service: GatewayAuthService;
  let client: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayAuthService,
        {
          provide: 'AUTH_SERVICE',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GatewayAuthService>(GatewayAuthService);
    client = module.get<ClientProxy>('AUTH_SERVICE');
  });

  it('should sign in a user', async () => {
    // Given
    const data = {};
    const response = { status: 'success' };
    jest.spyOn(client, 'send').mockImplementation(() => of(response));

    // When
    const result = await lastValueFrom(service.signIn(data));

    // Then
    expect(result).toEqual(response);
    expect(client.send).toHaveBeenCalledWith({ cmd: 'sign-in' }, data);
  });

  it('should sign up a user', async () => {
    // Given
    const data = {};
    const response = { status: 'success' };
    jest.spyOn(client, 'send').mockImplementation(() => of(response));

    // When
    const result = await lastValueFrom(service.signUp(data));

    // Then
    expect(result).toEqual(response);
    expect(client.send).toHaveBeenCalledWith({ cmd: 'sign-up' }, data);
  });

  it('should validate a jwt token', async () => {
    // Given
    const data = { token: '' };
    const response = { status: 'success' };
    jest.spyOn(client, 'send').mockImplementation(() => of(response));

    // When
    const result = await lastValueFrom(service.validateToken(data));

    // Then
    expect(result).toEqual(response);
    expect(client.send).toHaveBeenCalledWith({ cmd: 'validate-token' }, data);
  });

  it('should refresh a jwt token', async () => {
    // Given
    const data = { token: '' };
    const response = { status: 'success' };
    jest.spyOn(client, 'send').mockImplementation(() => of(response));

    // When
    const result = await lastValueFrom(service.refreshToken(data));

    // Then
    expect(result).toEqual(response);
    expect(client.send).toHaveBeenCalledWith({ cmd: 'refresh-token' }, data);
  });
});
