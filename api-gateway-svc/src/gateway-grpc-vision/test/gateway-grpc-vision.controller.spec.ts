import { BadRequestException } from '@nestjs/common';
import {
  ImgProcRequest,
  ImgProcResponse,
  ModelType,
} from '../proto-types/computer_vision';
import { GatewayGrpcVisionService } from '../gateway-grpc-vision.service';
import { JwtAuthGuard } from '../../gateway-auth/guards/jwt-auth.guard';
import { GatewayAuthService } from '../../gateway-auth/gateway-auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { GatewayGrpcVisionController } from '../gateway-grpc-vision.controller';

describe('GatewayGrpcVisionController', () => {
  let controller: GatewayGrpcVisionController;
  let visionService: GatewayGrpcVisionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayGrpcVisionController],
      providers: [
        {
          provide: GatewayGrpcVisionService,
          useValue: {
            processImage: jest.fn(),
            processImageBatch: jest.fn(),
          },
        },
        {
          provide: GatewayAuthService,
          useValue: {
            validateToken: jest.fn(),
          },
        },
        JwtAuthGuard,
      ],
    }).compile();

    controller = module.get<GatewayGrpcVisionController>(
      GatewayGrpcVisionController,
    );
    visionService = module.get<GatewayGrpcVisionService>(
      GatewayGrpcVisionService,
    );
  });

  describe('processImage', () => {
    const files = [
      { originalname: 'image1.jpg', buffer: Buffer.from('file1') },
      { originalname: 'image2.jpg', buffer: Buffer.from('file2') },
    ] as Express.Multer.File[];

    const model: ModelType = ModelType.BLIP;

    it('should process a single image', async () => {
      // Given
      const file: Express.Multer.File = files[0];
      const data: ImgProcRequest = { image: file.buffer, model };
      const response: ImgProcResponse = { description: 'processed' };
      jest.spyOn(visionService, 'processImage').mockResolvedValue(response);

      // When
      const result = await controller.processImage([file], model);

      // Then
      expect(result).toEqual(response);
      expect(visionService.processImage).toHaveBeenCalledWith(data);
    });

    it('should process multiple images', async () => {
      // Given
      const requests: ImgProcRequest[] = files.map((file) => ({
        image: file.buffer,
        model,
      }));
      const responses: ImgProcResponse[] = [
        { description: 'processed1' },
        { description: 'processed2' },
      ];
      jest
        .spyOn(visionService, 'processImageBatch')
        .mockReturnValue(of(...responses));

      // When
      const result = await controller.processImage(files, model);

      // Then
      expect(result).toEqual(responses);
      expect(visionService.processImageBatch).toHaveBeenCalledWith(requests);
    });

    it('should throw BadRequestException if no files are uploaded', async () => {
      // Given
      const file: Express.Multer.File[] = [];

      // When
      const result = controller.processImage(file, model);

      // Then
      await expect(result).rejects.toThrow(BadRequestException);
    });
  });
});
