import { Test, TestingModule } from '@nestjs/testing';
import { GatewayGrpcVisionService } from '../gateway-grpc-vision.service';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ComputerVisionClient,
  ImgProcRequest,
  ImgProcResponse,
} from '../proto-types/computer_vision';
import { of, toArray } from 'rxjs';
import { lastValueFrom } from 'rxjs';

describe('GatewayGrpcVisionService', () => {
  let service: GatewayGrpcVisionService;
  let client: ClientGrpc;
  let computerVisionClient: ComputerVisionClient;

  beforeEach(async () => {
    const mockComputerVisionClient = {
      processImage: jest.fn(),
      processImageBatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GatewayGrpcVisionService,
        {
          provide: 'VISION_SERVICE',
          useValue: {
            getService: jest.fn().mockReturnValue(mockComputerVisionClient),
          },
        },
      ],
    }).compile();

    service = module.get<GatewayGrpcVisionService>(GatewayGrpcVisionService);
    client = module.get<ClientGrpc>('VISION_SERVICE');
    computerVisionClient =
      client.getService<ComputerVisionClient>('ComputerVision');

    // Manually call onModuleInit to initialize the service
    service.onModuleInit();
  });

  describe('processImage', () => {
    it('should process a single image', async () => {
      // Given
      const data: ImgProcRequest = { image: Buffer.from('test'), model: 0 };
      const response: ImgProcResponse = { description: 'test response' };
      jest
        .spyOn(computerVisionClient, 'processImage')
        .mockReturnValue(of(response));

      // When
      const result = await service.processImage(data);

      // Then
      expect(computerVisionClient.processImage).toHaveBeenCalledWith(data);
      expect(result).toEqual(response);
    });
  });

  describe('processImageBatch', () => {
    it('should process a batch of images', async () => {
      // Given
      const data: ImgProcRequest[] = [
        { image: Buffer.from('test1'), model: 0 },
        { image: Buffer.from('test2'), model: 1 },
      ];
      const response: ImgProcResponse[] = [
        { description: 'test response 1' },
        { description: 'test response 2' },
      ];
      jest
        .spyOn(computerVisionClient, 'processImageBatch')
        .mockReturnValue(of(...response));

      // When
      const result = await lastValueFrom(
        service.processImageBatch(data).pipe(toArray()),
      );

      // Then
      expect(computerVisionClient.processImageBatch).toHaveBeenCalled();
      expect(result).toEqual(response);
    });
  });
});
