import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService)

  // Get the environment variables
  const USER = configService.get('RABBITMQ_USER');
  const PASS = configService.get('RABBITMQ_PASS');
  const HOST = configService.get('RABBITMQ_HOST');
  const QUEUE = configService.get('RABBITMQ_QUEUE');
  const CERT_PATH = configService.get('RABBITMQ_CERT_PATH');
  const KEY_PATH = configService.get('RABBITMQ_KEY_PATH');
  const PASSPHRASE = configService.get('RABBITMQ_PASSPHRASE');
  const CA_PATH = configService.get('RABBITMQ_CA_PATH');

  // Create connection to RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqps://${USER}:${PASS}@${HOST}`],
      noAck: false,
      queue: QUEUE,
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        cert: fs.readFileSync(CERT_PATH),
        key: fs.readFileSync(KEY_PATH),
        passphrase: PASSPHRASE,
        ca: [fs.readFileSync(CA_PATH)],
      }
    },
  });

  app.startAllMicroservices();
}
bootstrap();