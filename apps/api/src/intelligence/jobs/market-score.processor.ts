import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import type { SupportedPlatform } from '@prezence/types';
import { AiUsageService } from '../../ai';
import { MarketScore } from '../entities/market-score.entity';

export interface MarketFitJobData {
  userId: string;
  platform: SupportedPlatform;
  content: Record<string, string>;
  qualityScore: number;
  keywordsUsed: string[];
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function computeCompleteness(sections: Record<string, string>): number {
  const values = Object.values(sections).filter((v) => v && v.trim().length > 0);
  if (values.length === 0) return 0;
  const avgLen = values.reduce((s, v) => s + v.length, 0) / values.length;
  return Math.min(100, Math.round((avgLen / 500) * 100));
}

@Processor(QUEUE_NAMES.mfs_compute)
export class MarketScoreProcessor extends WorkerHost {
  private readonly logger = new Logger(MarketScoreProcessor.name);

  constructor(
    @InjectRepository(MarketScore)
    private readonly marketScoreRepo: Repository<MarketScore>,
    private readonly aiUsage: AiUsageService,
  ) {
    super();
  }

  async process(job: Job<MarketFitJobData>): Promise<void> {
    const { userId, platform, content, keywordsUsed } = job.data;
    this.logger.log(`Computing market-fit score for ${userId}/${platform}`);

    const completeness = computeCompleteness(content);
    const keywordDensity = Math.min(100, keywordsUsed.length * 10);
    const recency = 100;
    const marketDemand = await this.computeMarketDemand(userId, platform, content, keywordsUsed);

    const overallScore = Math.round(
      (completeness + keywordDensity + marketDemand + recency) / 4,
    );

    await this.marketScoreRepo.upsert(
      {
        userId,
        platform,
        score: overallScore,
        completeness,
        keywordDensity,
        marketDemand,
        recency,
        recommendations: [],
        computedAt: new Date(),
      },
      ['userId', 'platform'],
    );

    this.logger.log(
      `Market-fit score saved: ${overallScore} for ${userId}/${platform} ` +
        `(completeness=${completeness}, kw=${keywordDensity}, demand=${marketDemand})`,
    );
  }

  private async computeMarketDemand(
    userId: string,
    platform: SupportedPlatform,
    content: Record<string, string>,
    keywords: string[],
  ): Promise<number> {
    const contentSummary = Object.entries(content)
      .map(([k, v]) => `${k}: ${v.slice(0, 200)}`)
      .join('\n');

    const prompt =
      `You are a career market analyst for the African tech ecosystem (Cameroon and sub-Saharan Africa).\n` +
      `Analyze this ${platform} profile and score market demand for this professional on a scale of 0–100.\n` +
      `Consider: local/regional demand for these skills, sector growth, platform relevance in Africa.\n` +
      `Keywords present: ${keywords.join(', ') || 'none'}\n\n` +
      `Profile content:\n${contentSummary}\n\n` +
      `Return ONLY valid JSON: {"score": <0-100>}`;

    try {
      const { content: raw } = await this.aiUsage.generate({
        task: 'scoring',
        userId,
        feature: 'market_demand',
        messages: [{ role: 'user', content: prompt }],
        options: { max_tokens: 64 },
      });

      const parsed = JSON.parse(stripCodeFences(raw)) as { score: number };
      const score = Number(parsed.score);
      if (!Number.isFinite(score)) return 70;
      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (err) {
      this.logger.warn(
        `Market demand AI call failed, defaulting to 70: ${String(err)}`,
      );
      return 70;
    }
  }
}
