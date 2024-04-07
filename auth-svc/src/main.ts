import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as fs from 'fs';

/**
 * Initializes and configures the NestJS application, connecting it to RabbitMQ as a microservice.
 * This setup involves reading environment variables for RabbitMQ configuration,
 * establishing a secure connection, and starting the microservice.
 * 
 * The `bootstrap` function performs the following steps:
 * - Creates a NestJS application instance based on `AuthModule`.
 * - Retrieves RabbitMQ configuration from environment variables via `ConfigService`.
 * - Configures and connects the application to RabbitMQ with SSL/TLS security.
 * - Starts the RabbitMQ microservice to begin processing messages.
 * 
 * @async
 * @function bootstrap
 * @returns {Promise<void>} A promise that resolves when the application is fully initialized and the microservices have started.
 */
async function bootstrap() {
  // Initializes the NestJS application with the AuthModule.
  const app = await NestFactory.create(AuthModule);

  // Accesses the application's configuration settings.
  const configService = app.get(ConfigService);

  // Extracts RabbitMQ configuration settings from environment variables.
  const USER = configService.get('RABBITMQ_USER');
  const PASS = configService.get('RABBITMQ_PASS');
  const HOST = configService.get('RABBITMQ_HOST');
  const QUEUE = configService.get('RABBITMQ_QUEUE');
  const CERT_PATH = configService.get('RABBITMQ_CERT_PATH');
  const KEY_PATH = configService.get('RABBITMQ_KEY_PATH');
  const PASSPHRASE = configService.get('RABBITMQ_PASSPHRASE');
  const CA_PATH = configService.get('RABBITMQ_CA_PATH');

  // Establishes the microservice connection with RabbitMQ using the configuration parameters.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ, // Defines the transport mechanism as RabbitMQ.
    options: {
      urls: [`amqps://${USER}:${PASS}@${HOST}`], // Constructs the connection URL for RabbitMQ.
      noAck: false, // Enables message acknowledgments for reliability.
      queue: QUEUE, // Specifies the queue to which the application connects.
      queueOptions: { durable: true }, // Ensures the queue remains active across RabbitMQ restarts.
      socketOptions: {
        cert: fs.readFileSync(CERT_PATH), // Reads the SSL certificate for secure connections.
        key: fs.readFileSync(KEY_PATH), // Reads the SSL key for secure connections.
        passphrase: PASSPHRASE, // Supplies the passphrase for the SSL key.
        ca: [fs.readFileSync(CA_PATH)], // Includes the Certificate Authority for SSL connections.
      }
    },
  });

  // Starts all configured microservices to enable the application to process messages.
  await app.startAllMicroservices();

  // Optional: Starts the HTTP server if your application serves HTTP requests.
  // await app.listen(3000);
}

// Executes the bootstrap function to start the application.
bootstrap();
