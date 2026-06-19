import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AI_MODELS } from '@prezence/config';
import { AiUsageLog } from '../entities/ai-usage-log.entity';
import type { OpenRouterMessage } from './model-router.service';
import { ModelRouterService } from './model-router.service';

export type AiTask = 'generation' | 'qa' | 'scoring';

export interface ModelBreakdown {
  model: string;
  requests: number;
  totalTokens: number;
  costUsd: number | null;
}

export interface FeatureBreakdown {
  feature: string;
  requests: number;
  totalTokens: number;
}

export interface UserUsageSummary {
  periodDays: number;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number | null;
  byModel: ModelBreakdown[];
  byFeature: FeatureBreakdown[];
}

export interface DayBreakdown {
  date: string;
  requests: number;
  totalTokens: number;
}

export interface TopUser {
  userId: string;
  requests: number;
  totalTokens: number;
}

export interface SystemUsageSummary {
  periodDays: number;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number | null;
  byModel: ModelBreakdown[];
  byDay: DayBreakdown[];
  topUsers: TopUser[];
}

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

  async getUserUsageSummary(
    userId: string,
    days = 30,
  ): Promise<UserUsageSummary> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.usageRepo
      .createQueryBuilder('log')
      .select('log.model', 'model')
      .addSelect('log.feature', 'feature')
      .addSelect('COUNT(*)', 'requests')
      .addSelect('SUM(log.total_tokens)', 'totalTokens')
      .addSelect('SUM(log.estimated_cost_usd)', 'costUsd')
      .where('log.userId = :userId', { userId })
      .andWhere('log.createdAt >= :since', { since })
      .groupBy('log.model')
      .addGroupBy('log.feature')
      .getRawMany<{
        model: string;
        feature: string;
        requests: string;
        totalTokens: string;
        costUsd: string | null;
      }>();

    const byModelMap = new Map<string, ModelBreakdown>();
    const byFeatureMap = new Map<string, FeatureBreakdown>();

    for (const row of rows) {
      const reqs = parseInt(row.requests, 10);
      const tokens = parseInt(row.totalTokens, 10) || 0;
      const cost = row.costUsd !== null ? parseFloat(row.costUsd) : null;

      const existing = byModelMap.get(row.model);
      if (existing) {
        existing.requests += reqs;
        existing.totalTokens += tokens;
        if (cost !== null) existing.costUsd = (existing.costUsd ?? 0) + cost;
      } else {
        byModelMap.set(row.model, {
          model: row.model,
          requests: reqs,
          totalTokens: tokens,
          costUsd: cost,
        });
      }

      const ef = byFeatureMap.get(row.feature);
      if (ef) {
        ef.requests += reqs;
        ef.totalTokens += tokens;
      } else {
        byFeatureMap.set(row.feature, {
          feature: row.feature,
          requests: reqs,
          totalTokens: tokens,
        });
      }
    }

    const byModel = [...byModelMap.values()].sort(
      (a, b) => b.totalTokens - a.totalTokens,
    );
    const byFeature = [...byFeatureMap.values()].sort(
      (a, b) => b.requests - a.requests,
    );

    const totalRequests = byModel.reduce((s, r) => s + r.requests, 0);
    const totalTokens = byModel.reduce((s, r) => s + r.totalTokens, 0);
    const totalCostUsd = byModel.some((r) => r.costUsd !== null)
      ? byModel.reduce((s, r) => s + (r.costUsd ?? 0), 0)
      : null;

    return {
      periodDays: days,
      totalRequests,
      totalTokens,
      totalCostUsd,
      byModel,
      byFeature,
    };
  }

  async getSystemUsageSummary(days = 30): Promise<SystemUsageSummary> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [modelRows, dayRows, topUserRows] = await Promise.all([
      this.usageRepo
        .createQueryBuilder('log')
        .select('log.model', 'model')
        .addSelect('COUNT(*)', 'requests')
        .addSelect('SUM(log.total_tokens)', 'totalTokens')
        .addSelect('SUM(log.estimated_cost_usd)', 'costUsd')
        .where('log.createdAt >= :since', { since })
        .groupBy('log.model')
        .getRawMany<{
          model: string;
          requests: string;
          totalTokens: string;
          costUsd: string | null;
        }>(),

      this.usageRepo
        .createQueryBuilder('log')
        .select("DATE(log.createdAt AT TIME ZONE 'UTC')", 'date')
        .addSelect('COUNT(*)', 'requests')
        .addSelect('SUM(log.total_tokens)', 'totalTokens')
        .where('log.createdAt >= :since', { since })
        .groupBy("DATE(log.createdAt AT TIME ZONE 'UTC')")
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; requests: string; totalTokens: string }>(),

      this.usageRepo
        .createQueryBuilder('log')
        .select('log.userId', 'userId')
        .addSelect('COUNT(*)', 'requests')
        .addSelect('SUM(log.total_tokens)', 'totalTokens')
        .where('log.createdAt >= :since', { since })
        .andWhere('log.userId IS NOT NULL')
        .groupBy('log.userId')
        .orderBy('SUM(log.total_tokens)', 'DESC')
        .limit(10)
        .getRawMany<{
          userId: string;
          requests: string;
          totalTokens: string;
        }>(),
    ]);

    const byModel: ModelBreakdown[] = modelRows.map((r) => ({
      model: r.model,
      requests: parseInt(r.requests, 10),
      totalTokens: parseInt(r.totalTokens, 10) || 0,
      costUsd: r.costUsd !== null ? parseFloat(r.costUsd) : null,
    }));

    const byDay: DayBreakdown[] = dayRows.map((r) => ({
      date: r.date,
      requests: parseInt(r.requests, 10),
      totalTokens: parseInt(r.totalTokens, 10) || 0,
    }));

    const topUsers: TopUser[] = topUserRows.map((r) => ({
      userId: r.userId,
      requests: parseInt(r.requests, 10),
      totalTokens: parseInt(r.totalTokens, 10) || 0,
    }));

    const totalRequests = byModel.reduce((s, r) => s + r.requests, 0);
    const totalTokens = byModel.reduce((s, r) => s + r.totalTokens, 0);
    const totalCostUsd = byModel.some((r) => r.costUsd !== null)
      ? byModel.reduce((s, r) => s + (r.costUsd ?? 0), 0)
      : null;

    return {
      periodDays: days,
      totalRequests,
      totalTokens,
      totalCostUsd,
      byModel,
      byDay,
      topUsers,
    };
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
