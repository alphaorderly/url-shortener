import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { ErrorDto } from 'src/dtos/error.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  hashPassword(password: string): string {
    return createHash('sha256')
      .update(password + process.env.HASH_SALT)
      .digest('hex');
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<User | undefined> {
    const hashed = this.hashPassword(password);

    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .andWhere('user.password = :password', {
        password: hashed,
      })
      .getOne();
  }

  async register(
    username: string,
    password: string,
  ): Promise<User | undefined> {
    const hashed = this.hashPassword(password);

    const user = this.userRepository.create({
      username,
      password: hashed,
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.createQueryBuilder('user').getMany();
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .andWhere('user.password = :password', {
        password: this.hashPassword(oldPassword),
      })
      .getOne();

    if (!user) {
      return new ErrorDto('현재 비밀번호가 일치하지 않습니다.');
    }

    user.password = this.hashPassword(newPassword);
    const changedUser = await this.userRepository.save(user);

    return changedUser;
  }
}
