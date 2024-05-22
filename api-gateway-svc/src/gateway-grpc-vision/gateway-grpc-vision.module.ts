import { Module } from '@nestjs/common';
import { GatewayGrpcVisionService } from './gateway-grpc-vision.service';
import { GatewayGrpcVisionController } from './gateway-grpc-vision.controller';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { resolve } from 'path';
import { GatewayAuthModule } from 'src/gateway-auth/gateway-auth.module';

@Module({
  imports: [GatewayAuthModule],
  providers: [
    GatewayGrpcVisionService,
    {
      provide: 'VISION_SERVICE',
      useFactory: (configService: ConfigService) => {
        const VISION_HOST = configService.get<string>('VISION_HOST');
        const VISION_PORT = configService.get<number>('VISION_PORT');

        return ClientProxyFactory.create({
          transport: Transport.GRPC,
          options: {
            url: `${VISION_HOST}:${VISION_PORT}`,
            package: 'computer_vision',
            protoPath: resolve(__dirname, 'proto', 'computer_vision.proto'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  controllers: [GatewayGrpcVisionController],
})
export class GatewayGrpcVisionModule {}
