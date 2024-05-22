import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  ComputerVisionClient,
  ImgProcRequest,
  ImgProcResponse,
} from './proto-types/computer_vision';
import { lastValueFrom, Observable, ReplaySubject } from 'rxjs';

/**
 * GatewayGrpcVisionService provides methods to interact with the gRPC-based
 * Computer Vision service. It supports image processing tasks by sending requests
 * to the underlying microservice.
 */
@Injectable()
export class GatewayGrpcVisionService implements OnModuleInit {
  private computerVisionService: ComputerVisionClient;

  /**
   * Initializes GatewayGrpcVisionService with a ClientGrpc to interact with
   * the computer vision microservice.
   *
   * @param {ClientGrpc} client ClientGrpc instance injected for communication with the gRPC service.
   */
  constructor(@Inject('VISION_SERVICE') private readonly client: ClientGrpc) {}

  /**
   * Called after the module initialization. This method sets up the client to use
   * the Computer Vision service.
   */
  onModuleInit() {
    this.computerVisionService =
      this.client.getService<ComputerVisionClient>('ComputerVision');
  }

  /**
   * Processes a single image based on the provided ImgProcRequest and returns the processing result.
   *
   * @param {ImgProcRequest} data Request data for image processing which includes the image and model type.
   * @returns {Promise<ImgProcResponse>} A Promise that resolves to the processing results.
   */
  processImage(data: ImgProcRequest): Promise<ImgProcResponse> {
    return lastValueFrom(this.computerVisionService.processImage(data));
  }

  /**
   * Processes a batch of images using the gRPC stream method. It wraps the provided request data in
   * a ReplaySubject to emulate a stream of data.
   *
   * @param {ImgProcRequest[]} data Array of request data for batch image processing.
   * @returns {Observable<ImgProcResponse>} An Observable that emits processing results for the batch.
   */
  processImageBatch(data: ImgProcRequest[]): Observable<ImgProcResponse> {
    const subject = new ReplaySubject<ImgProcRequest>();

    // Emulate a stream by pushing each request data and then completing the stream.
    data.forEach((request) => subject.next(request));
    subject.complete();

    // Initiates the batch processing using the gRPC service.
    return this.computerVisionService.processImageBatch(subject.asObservable());
  }
}
