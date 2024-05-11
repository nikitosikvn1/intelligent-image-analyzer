import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayAuthModule } from './gateway-auth/gateway-auth.module';

@Module({
  imports: [
    // Import global configuration for application, reading from the .env file.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GatewayAuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
