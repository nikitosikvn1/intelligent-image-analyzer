import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignUpDto, SignUpResultDto, SignInResultDto, SignInDto, JwtDto, JwtResultDto } from './dto';
import { User } from './entities/user.entity';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService
  ) { }

  async signUp(dto: SignUpDto): Promise<SignUpResultDto> {
    // Check if user with such email already exists
    const user = await this.userRepository.findOneBy({ email: dto.email });

    if (user) {
      throw new ConflictException('User with such email already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // Create a new user
    const newUser = this.userRepository.create({
      firstname: dto.firstname,
      lastname: dto.lastname,
      email: dto.email,
      password: hashedPassword
    });

    // Save the user to the database
    await this.userRepository.save(newUser);
    return {
      status: 'success',
      message: 'User has been registered'
    };
  }

  async signIn(dto: SignInDto): Promise<SignInResultDto> {
    // Check if user with such email exists
    const user = await this.userRepository.findOneBy({ email: dto.email });

    if (!user) {
      throw new ConflictException('User with such email does not exist');
    }

    // Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordCorrect) {
      throw new ConflictException('Password is incorrect');
    }

    // Generate and return the tokens
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      status: 'success',
      message: 'JWT has been generated',
      token: accessToken
    }
  }

  async validateToken(dto: JwtDto): Promise<JwtResultDto> {
    try {
      this.jwtService.verify(dto.token);
      return {
        isValid: true,
        message: 'Token is valid'
      };
    } catch (err) {
      return {
        isValid: false,
        message: this.getTokenErrorMessage(err),
      };
    }
  }

  private getTokenErrorMessage(err: TokenExpiredError | JsonWebTokenError): string {
    if (err instanceof TokenExpiredError) {
      return 'Token expired';
    } else if (err instanceof JsonWebTokenError) {
      return 'Invalid token';
    } else {
      return 'Token verification failed';
    }
  }
}