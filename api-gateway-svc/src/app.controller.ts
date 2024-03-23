import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly auth_service: ClientProxy,
  ) { }

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('user')
  async getUser() {
    return this.auth_service.send({ cmd: 'get-user' }, {});
  }
}