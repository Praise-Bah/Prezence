import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { PromptRegistry } from '../entities/prompt-registry.entity';

const PROMPT_CACHE_TTL = 60 * 60; // 1 hour

@Injectable()
export class PromptRegistryService {
  private readonly logger = new Logger(PromptRegistryService.name);

  constructor(
    @InjectRepository(PromptRegistry)
    private readonly repo: Repository<PromptRegistry>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async getActive(name: string): Promise<PromptRegistry> {
    const cacheKey = `prompt:${name}:active`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as PromptRegistry;
    }

    const prompt = await this.repo.findOne({
      where: { name, isActive: true },
      order: { version: 'DESC' },
    });

    if (!prompt) {
      throw new NotFoundException(`No active prompt found for name: ${name}`);
    }

    await this.redis.set(
      cacheKey,
      JSON.stringify(prompt),
      'EX',
      PROMPT_CACHE_TTL,
    );
    return prompt;
  }

  render(template: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce(
      (tpl, [key, value]) => tpl.replaceAll(`{{${key}}}`, value),
      template,
    );
  }
}
