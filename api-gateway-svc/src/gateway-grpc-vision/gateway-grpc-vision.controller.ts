import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ImgProcRequest,
  ImgProcResponse,
  ModelType,
} from './proto-types/computer_vision';
import { GatewayGrpcVisionService } from './gateway-grpc-vision.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { lastValueFrom } from 'rxjs';

@Controller('vision')
export class GatewayGrpcVisionController {
  constructor(
    private readonly gatewayVisionService: GatewayGrpcVisionService,
  ) {}

  @Post('process-image')
  @UseInterceptors(AnyFilesInterceptor())
  async processImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('model') model: ModelType,
  ): Promise<ImgProcResponse | ImgProcResponse[]> {
    if (files.length === 1) {
      const file = files[0];
      const data: ImgProcRequest = {
        image: file.buffer,
        model,
      };

      console.log('Processing image:', file.originalname);

      return await this.gatewayVisionService.processImage(data);
    } else if (files.length > 1) {
      const responses: Promise<ImgProcResponse>[] = files.map((file) => {
        const data: ImgProcRequest = {
          image: file.buffer,
          model,
        };

        console.log('Processing image:', file.originalname);

        return lastValueFrom(this.gatewayVisionService.processImageBatch(data));
      });

      return await Promise.all(responses);
    } else {
      throw new BadRequestException('No files uploaded');
    }
  }
}
