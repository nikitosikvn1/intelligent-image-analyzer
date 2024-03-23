import { Controller, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SignUpDto, SignInDto, JwtDto, SignUpResultDto, SignInResultDto, JwtResultDto } from './dto/';
import { RpcValidationFilter } from './filters/rpc.validation.filter';

@UseFilters(new RpcValidationFilter())
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern({ cmd: 'sign-up' })
  @UsePipes(ValidationPipe)
  async signUp(@Payload() dto: SignUpDto): Promise<SignUpResultDto> {
    return await this.authService.signUp(dto);
  }
}
