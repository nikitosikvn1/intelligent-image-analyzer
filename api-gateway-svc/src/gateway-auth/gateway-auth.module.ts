import { Module } from '@nestjs/common';
import { GatewayAuthService } from './gateway-auth.service';
import { GatewayAuthController } from './gateway-auth.controller';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Module({
  imports: [],
  providers: [
    GatewayAuthService,
    {
      provide: 'AUTH_SERVICE',
      useFactory: (configService: ConfigService) => {
        // Extracting necessary configurations from environment variables.
        const USER = configService.get<string>('RABBITMQ_USER');
        const PASS = configService.get<string>('RABBITMQ_PASS');
        const HOST = configService.get<string>('RABBITMQ_HOST');
        const QUEUE = configService.get<string>('RABBITMQ_QUEUE');
        const CERT_PATH = configService.get<string>('RABBITMQ_CERT_PATH');
        const KEY_PATH = configService.get<string>('RABBITMQ_KEY_PATH');
        const PASSPHRASE = configService.get<string>('RABBITMQ_PASSPHRASE');
        const CA_PATH = configService.get<string>('RABBITMQ_CA_PATH');

        // Create and return the RabbitMQ client proxy with secure options.
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`amqp://${USER}:${PASS}@${HOST}`],
            queue: QUEUE,
            queueOptions: {
              durable: true,
            },
            socketOptions: {
              cert: fs.readFileSync(CERT_PATH),
              key: fs.readFileSync(KEY_PATH),
              passphrase: PASSPHRASE,
              ca: [fs.readFileSync(CA_PATH)],
            },
          },
        });
      },
      inject: [ConfigService], // Injecting ConfigService for use in the factory function.
    },
  ],
  controllers: [GatewayAuthController],
  exports: [GatewayAuthService],
})
export class GatewayAuthModule {}
