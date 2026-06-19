import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AI_MODELS } from '@prezence/config';
import { AiUsageLog } from '../entities/ai-usage-log.entity';
import type { OpenRouterMessage } from './model-router.service';
import { ModelRouterService } from './model-router.service';

export type AiTask = 'generation' | 'qa' | 'scoring';

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    private readonly modelRouter: ModelRouterService,
    @InjectRepository(AiUsageLog)
    private readonly usageRepo: Repository<AiUsageLog>,
  ) {}

  async generate(params: {
    task: AiTask;
    userId?: string;
    feature: string;
    messages: OpenRouterMessage[];
    options?: { max_tokens?: number };
  }): Promise<{
    content: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }> {
    const model = AI_MODELS[params.task];
    const result = await this.modelRouter.generate(
      model,
      params.messages,
      params.options,
    );
    this.logUsage({
      userId: params.userId,
      model,
      feature: params.feature,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
    });
    return {
      content: result.content,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
    };
  }

  async embed(params: {
    userId?: string;
    feature: string;
    text: string;
  }): Promise<{ embedding: number[]; tokenCount: number }> {
    const model = AI_MODELS.embedding;
    const result = await this.modelRouter.embed(params.text, model);
    this.logUsage({
      userId: params.userId,
      model,
      feature: params.feature,
      promptTokens: result.tokenCount,
      completionTokens: 0,
      totalTokens: result.tokenCount,
    });
    return result;
  }

  private logUsage(params: {
    userId?: string;
    model: string;
    feature: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }): void {
    this.usageRepo
      .save(
        this.usageRepo.create({
          userId: params.userId ?? null,
          model: params.model,
          feature: params.feature,
          promptTokens: params.promptTokens,
          completionTokens: params.completionTokens,
          totalTokens: params.totalTokens,
        }),
      )
      .catch((err: unknown) => {
        this.logger.warn(`Failed to log AI usage: ${String(err)}`);
      });
  }
}
