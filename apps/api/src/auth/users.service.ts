import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import type { SubscriptionPlan } from '@prezence/types';
import type { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const BCRYPT_COST = 12;

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

  findManyByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.usersRepository.find({ where: { id: In(ids) } });
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

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.usersRepository.update(userId, { passwordHash });
  }

  async findOrCreateSocialUser(params: {
    email: string;
    name: string | null;
    countryCode?: string;
  }): Promise<User> {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      if (params.name && !existing.name) {
        await this.usersRepository.update(existing.id, { name: params.name });
        existing.name = params.name;
      }
      return existing;
    }

    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      BCRYPT_COST,
    );

    return this.usersRepository.save(
      this.usersRepository.create({
        email: params.email,
        name: params.name,
        passwordHash,
        countryCode: params.countryCode ?? 'CM',
        language: 'en',
      }),
    );
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
