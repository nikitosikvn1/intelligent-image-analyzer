import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ComputerVisionClient,
  ImgProcRequest,
  ImgProcResponse,
} from './proto-types/computer_vision';
import { lastValueFrom, Observable, ReplaySubject } from 'rxjs';

@Injectable()
export class GatewayGrpcVisionService implements OnModuleInit {
  private computerVisionService: ComputerVisionClient;

  constructor(@Inject('VISION_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.computerVisionService =
      this.client.getService<ComputerVisionClient>('ComputerVision');
  }

  processImage(data: ImgProcRequest): Promise<ImgProcResponse> {
    return lastValueFrom(this.computerVisionService.processImage(data));
  }

  processImageBatch(data: ImgProcRequest): Observable<ImgProcResponse> {
    const subject = new ReplaySubject<ImgProcRequest>();

    subject.next(data);
    subject.complete();

    return this.computerVisionService.processImageBatch(subject);
  }
}
