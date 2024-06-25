import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayAuthModule } from './gateway-auth/gateway-auth.module';
import { GatewayGrpcVisionModule } from './gateway-grpc-vision/gateway-grpc-vision.module';

@Module({
  imports: [
    // Import global configuration for application, reading from the .env file.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GatewayAuthModule,
    GatewayGrpcVisionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
