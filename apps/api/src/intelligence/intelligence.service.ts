import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { INTERVIEW_VERSION, QUEUE_NAMES } from '@prezence/config';
import type {
  ContentGenerationJobData,
  SupportedPlatform,
} from '@prezence/types';
import type { GenerateContentDto } from './dto/generate-content.dto';
import { InterviewResponse } from './entities/interview-response.entity';
import { ProfileData } from './entities/profile-data.entity';
import { MarketScore } from './entities/market-score.entity';

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(
    @InjectRepository(InterviewResponse)
    private readonly interviewRepo: Repository<InterviewResponse>,
    @InjectRepository(ProfileData)
    private readonly profileRepo: Repository<ProfileData>,
    @InjectRepository(MarketScore)
    private readonly marketScoreRepo: Repository<MarketScore>,
    @InjectQueue(QUEUE_NAMES.content_generation)
    private readonly generationQueue: Queue<ContentGenerationJobData>,
  ) {}

  async submitInterview(
    userId: string,
    dto: GenerateContentDto,
  ): Promise<{ jobId: string; message: string }> {
    const existing = await this.interviewRepo.findOne({
      where: {
        userId,
        platform: dto.platform,
        interviewVersion: INTERVIEW_VERSION,
      },
    });

    let interviewResponse: InterviewResponse;

    if (existing) {
      await this.interviewRepo.update(existing.id, { answers: dto.answers });
      interviewResponse = { ...existing, answers: dto.answers };
    } else {
      interviewResponse = await this.interviewRepo.save(
        this.interviewRepo.create({
          userId,
          platform: dto.platform,
          interviewVersion: INTERVIEW_VERSION,
          answers: dto.answers,
        }),
      );
    }

    const job = await this.generationQueue.add(
      'generate',
      {
        userId,
        platform: dto.platform,
        interviewResponseId: interviewResponse.id,
        interviewVersion: INTERVIEW_VERSION,
        userLanguage: dto.language,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 10000 } },
    );

    this.logger.log(
      `Queued content generation job ${String(job.id)} for user ${userId} / ${dto.platform}`,
    );

    return {
      jobId: String(job.id),
      message:
        'Your profile is being generated. Check back in a few minutes or poll GET /intelligence/profile/:platform.',
    };
  }

  async getProfile(
    userId: string,
    platform: SupportedPlatform,
  ): Promise<ProfileData> {
    const profile = await this.profileRepo.findOne({
      where: { userId, platform },
      order: { interviewVersion: 'DESC', generatedAt: 'DESC' },
    });

    if (!profile) {
      throw new NotFoundException(
        `No generated profile found for platform: ${platform}. Submit an interview first.`,
      );
    }

    return profile;
  }

  async getMarketFit(
    userId: string,
    platform: SupportedPlatform,
  ): Promise<MarketScore> {
    const score = await this.marketScoreRepo.findOne({
      where: { userId, platform },
      order: { computedAt: 'DESC' },
    });

    if (!score) {
      throw new NotFoundException(
        `No market fit score found for platform: ${platform}. Generate a profile first.`,
      );
    }

    return score;
  }
}
