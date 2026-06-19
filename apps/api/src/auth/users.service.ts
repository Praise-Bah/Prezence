import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import type { SubscriptionPlan } from '@prezence/types';
import type { UpdateUserDto } from './dto/update-user.dto';
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

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const patch: Partial<User> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.bio !== undefined) patch.bio = dto.bio;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.language !== undefined) patch.language = dto.language;
    if (dto.timezone !== undefined) patch.timezone = dto.timezone;
    if (dto.email_notifications !== undefined)
      patch.emailNotifications = dto.email_notifications;
    if (dto.push_notifications !== undefined)
      patch.pushNotifications = dto.push_notifications;

    await this.usersRepository.update(userId, patch);
    return this.usersRepository.findOneOrFail({ where: { id: userId } });
  }

  async updatePlan(
    userId: string,
    plan: SubscriptionPlan,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager?.getRepository(User) ?? this.usersRepository;
    await repository.update(userId, { plan });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.usersRepository.update(userId, { passwordHash });
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
