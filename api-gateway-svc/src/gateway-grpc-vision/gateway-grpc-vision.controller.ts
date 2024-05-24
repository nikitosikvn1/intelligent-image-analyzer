import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ImgProcRequest,
  ImgProcResponse,
  ModelType,
} from './proto/computer_vision';
import { GatewayGrpcVisionService } from './gateway-grpc-vision.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { lastValueFrom, toArray } from 'rxjs';
import { JwtAuthGuard } from '../gateway-auth/guards/jwt-auth.guard';

/**
 * GatewayGrpcVisionController handles HTTP requests for image processing tasks.
 * It defines endpoints for processing single or multiple images using the gRPC-based
 * computer vision service.
 */
@Controller('vision')
export class GatewayGrpcVisionController {
  /**
   * Initializes GatewayGrpcVisionController with the GatewayGrpcVisionService.
   *
   * @param {GatewayGrpcVisionService} gatewayVisionService Instance of the service that interacts with the computer vision microservice.
   */
  constructor(
    private readonly gatewayVisionService: GatewayGrpcVisionService,
  ) {}

  /**
   * Endpoint for processing uploaded images. Supports both single and batch image processing.
   * The endpoint is protected by JWT authentication and uses an interceptor to handle file uploads.
   *
   * @param {Express.Multer.File[]} files Array of uploaded files to be processed.
   * @param {ModelType} model The model type to be used for processing the images.
   * @returns {Promise<ImgProcResponse | ImgProcResponse[]>} A promise that resolves to the processing result(s).
   * @throws {BadRequestException} If no files are uploaded.
   */
  @Post('process-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async processImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('model') model: ModelType,
  ): Promise<ImgProcResponse | ImgProcResponse[]> {
    // Handle single image upload
    if (files.length === 1) {
      const file = files[0];
      const data: ImgProcRequest = {
        image: file.buffer,
        model,
      };

      console.log('Processing image:', file.originalname);

      return await this.gatewayVisionService.processImage(data);
    }
    // Handle batch image upload
    else if (files.length > 1) {
      const requests: ImgProcRequest[] = files.map((file) => ({
        image: file.buffer,
        model,
      }));

      const responses: ImgProcResponse[] = await lastValueFrom(
        this.gatewayVisionService.processImageBatch(requests).pipe(toArray()),
      );
      return responses;
    }
    // Handle case where no files are uploaded
    else {
      throw new BadRequestException('No files uploaded');
    }
  }
}
