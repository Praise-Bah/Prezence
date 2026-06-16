import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  countryCode?: string;
  language?: 'en' | 'fr' | 'camfranglais';
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async updatePlan(
    userId: string,
    plan: import('@prezence/types').SubscriptionPlan,
  ): Promise<void> {
    await this.usersRepository.update(userId, { plan });
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = this.usersRepository.create({
      email: input.email,
      passwordHash: input.passwordHash,
      countryCode: input.countryCode ?? 'CM',
      language: input.language ?? 'en',
    });

    return this.usersRepository.save(user);
  }
}
