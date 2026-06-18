import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { CACHE_TTL, PLATFORM_CHAR_LIMITS, QUEUE_NAMES } from '@prezence/config';
import type {
  ContentGenerationJobData,
  GeneratedSections,
  QaResult,
} from '@prezence/types';
import { AiUsageService, PromptRegistryService } from '../../ai';
import { REDIS_CLIENT } from '../../redis';
import { NotificationService } from '../../notification';
import { InterviewResponse } from '../entities/interview-response.entity';
import { MarketScore } from '../entities/market-score.entity';
import { ProfileData } from '../entities/profile-data.entity';
import { EmbeddingService } from '../services/embedding.service';

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

@Processor(QUEUE_NAMES.content_generation)
export class ContentGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ContentGenerationProcessor.name);

  constructor(
    @InjectRepository(InterviewResponse)
    private readonly interviewRepo: Repository<InterviewResponse>,
    @InjectRepository(ProfileData)
    private readonly profileRepo: Repository<ProfileData>,
    @InjectRepository(MarketScore)
    private readonly marketScoreRepo: Repository<MarketScore>,
    private readonly aiUsage: AiUsageService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly embeddingService: EmbeddingService,
    private readonly notificationService: NotificationService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job<ContentGenerationJobData>): Promise<void> {
    const { userId, platform } = job.data;
    this.logger.log(
      `Processing generation job ${job.id} — ${platform} for user ${userId}`,
    );

    try {
      await this.run(job.data);
    } catch (err) {
      try {
        await this.notificationService.sendContentFailed(userId, platform);
      } catch (notifyErr) {
        this.logger.warn(
          `Failed to enqueue content_failed notification for user ${userId}: ${String(notifyErr)}`,
        );
      }
      throw err;
    }
  }

  private async run(data: ContentGenerationJobData): Promise<void> {
    const {
      userId,
      platform,
      interviewResponseId,
      interviewVersion,
      userLanguage,
    } = data;

    // 1. Load interview answers
    const interview = await this.interviewRepo.findOne({
      where: { id: interviewResponseId },
    });
    if (!interview) {
      throw new Error(`InterviewResponse ${interviewResponseId} not found`);
    }

    const answersText = Object.entries(interview.answers)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join('\n');

    // 2. Store embedding for this interview (for future RAG retrieval)
    await this.embeddingService.generateAndStore(
      userId,
      'interview_response',
      interviewResponseId,
      answersText,
      { platform, interviewVersion },
    );

    // 3. Retrieve similar embeddings for RAG context
    const similar = await this.embeddingService.findSimilar(
      userId,
      answersText,
      3,
    );
    const ragContext =
      similar.length > 0
        ? similar
            .map(
              (s) =>
                `--- Example (similarity: ${s.similarity.toFixed(2)}) ---\n${s.content}`,
            )
            .join('\n\n')
        : 'No similar profiles found yet.';

    // 4. Load generation prompt
    const genPrompt = await this.promptRegistry.getActive('generate_profile');
    const charLimits = JSON.stringify(
      PLATFORM_CHAR_LIMITS[platform] ?? {},
      null,
      2,
    );
    const renderedPrompt = this.promptRegistry.render(genPrompt.template, {
      platform,
      char_limits: charLimits,
      answers: answersText,
      rag_context: ragContext,
      language: userLanguage,
    });

    // 5. Generate content via Claude Sonnet
    const { content: rawGenerated } = await this.aiUsage.generate({
      task: 'generation',
      userId,
      feature: 'profile_generation',
      messages: [{ role: 'user', content: renderedPrompt }],
      options: { max_tokens: 4096 },
    });

    let generated: GeneratedSections;
    try {
      generated = JSON.parse(
        stripCodeFences(rawGenerated),
      ) as GeneratedSections;
    } catch {
      this.logger.error(`Generation JSON parse failed: ${rawGenerated}`);
      throw new Error('Content generation returned invalid JSON');
    }

    // 6. QA pass via Gemini Flash
    const qaPromptTemplate = await this.promptRegistry.getActive('qa_profile');
    const renderedQaPrompt = this.promptRegistry.render(
      qaPromptTemplate.template,
      {
        platform,
        content: JSON.stringify(generated.sections, null, 2),
        char_limits: charLimits,
      },
    );

    const { content: rawQa } = await this.aiUsage.generate({
      task: 'qa',
      userId,
      feature: 'qa_scoring',
      messages: [{ role: 'user', content: renderedQaPrompt }],
      options: { max_tokens: 1024 },
    });

    let qa: QaResult;
    try {
      qa = JSON.parse(stripCodeFences(rawQa)) as QaResult;
    } catch {
      this.logger.warn(`QA JSON parse failed — defaulting score to 50`);
      qa = {
        quality_score: 50,
        passes_constraints: true,
        issues: [],
        suggestions: [],
      };
    }

    // 7. Upsert profile_data — atomic ON CONFLICT DO UPDATE
    await this.profileRepo.upsert(
      {
        userId,
        platform,
        interviewVersion,
        content: { ...generated.sections },
        qualityScore: qa.quality_score,
        generatedAt: new Date(),
      },
      ['userId', 'platform', 'interviewVersion'],
    );

    // 8. Compute and store market score
    const completeness = this.computeCompleteness(generated.sections);
    const keywordDensity = Math.min(
      100,
      (generated.keywords_used?.length ?? 0) * 10,
    );
    const marketDemand = 70; // static for MVP; Phase 2 will compute dynamically
    const recency = 100;
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
        recommendations: qa.suggestions ?? [],
        computedAt: new Date(),
      },
      ['userId', 'platform'],
    );

    // 9. Cache result with versioned key
    const cacheKey = `gen:${userId}:${platform}:v${String(interviewVersion)}`;
    await this.redis.set(
      cacheKey,
      JSON.stringify(generated.sections),
      'EX',
      CACHE_TTL.generated_profile,
    );

    try {
      await this.notificationService.sendContentReady(
        userId,
        platform,
        qa.quality_score,
      );
    } catch (notifyErr) {
      this.logger.warn(
        `Failed to enqueue content_ready notification for user ${userId}: ${String(notifyErr)}`,
      );
    }

    this.logger.log(
      `Generation complete for job — quality: ${String(qa.quality_score)}, market: ${String(overallScore)}`,
    );
  }

  private computeCompleteness(sections: Record<string, string>): number {
    const values = Object.values(sections).filter(
      (v) => v && v.trim().length > 0,
    );
    const total = Math.max(Object.keys(sections).length, 1);
    return Math.round((values.length / total) * 100);
  }
}
