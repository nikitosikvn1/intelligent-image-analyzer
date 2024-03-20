import { Controller, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Ctx, RmqContext, Payload } from '@nestjs/microservices';
import { SignUpDto } from './dto/';
import { RpcValidationFilter } from './filters/rpc.validation.filter';

@UseFilters(new RpcValidationFilter())
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern({ cmd: 'sign-up' })
  @UsePipes(ValidationPipe)
  async signUp(@Payload() dto: SignUpDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const user = await this.authService.signUp(dto);
      channel.ack(originalMsg);
      if (user.success) {
        return {
          status: 'success',
          message: 'user has been registered',
          statusCode: 201
        };
      }
    } catch (error) {
      channel.ack(originalMsg);
      return {
        status: 'error',
        message: error.response || error.message,
      };
    }
  }
}
