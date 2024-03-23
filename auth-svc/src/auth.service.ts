import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignUpDto, SignUpResultDto } from './dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
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
}