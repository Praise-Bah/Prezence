import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { INTERVIEW_VERSION, QUEUE_NAMES } from '@prezence/config';
import type {
  ContentGenerationJobData,
  PlatformPublishJobData,
  SupportedPlatform,
} from '@prezence/types';
import { UsersService } from '../auth';
import { InterviewResponse, MarketScore, ProfileData } from '../intelligence';
import { REDIS_CLIENT } from '../redis';
import type { SchedulePostDto } from './dto/schedule-post.dto';
import { ScheduledPost } from './entities/scheduled-post.entity';

export interface PlatformSummary {
  platform: SupportedPlatform;
  hasContent: boolean;
  qualityScore: number | null;
  marketScore: number | null;
  generatedAt: Date | null;
  cached: boolean;
}

const PLAN_SCHEDULE_ACCESS = new Set(['professional', 'elite']);

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(ProfileData)
    private readonly profileRepo: Repository<ProfileData>,
    @InjectRepository(MarketScore)
    private readonly marketScoreRepo: Repository<MarketScore>,
    @InjectRepository(InterviewResponse)
    private readonly interviewRepo: Repository<InterviewResponse>,
    @InjectRepository(ScheduledPost)
    private readonly scheduleRepo: Repository<ScheduledPost>,
    @InjectQueue(QUEUE_NAMES.content_generation)
    private readonly generationQueue: Queue<ContentGenerationJobData>,
    @InjectQueue(QUEUE_NAMES.content_schedule)
    private readonly scheduleQueue: Queue<
      PlatformPublishJobData & { scheduledPostId: string }
    >,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private readonly usersService: UsersService,
  ) {}

  async getContent(
    userId: string,
    platform: SupportedPlatform,
    interviewVersion = INTERVIEW_VERSION,
  ): Promise<{ content: Record<string, string>; cached: boolean }> {
    const cacheKey = `gen:${userId}:${platform}:v${String(interviewVersion)}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      try {
        return {
          content: JSON.parse(cached) as Record<string, string>,
          cached: true,
        };
      } catch {
        this.logger.warn(
          `Corrupt cache entry for ${cacheKey} — falling through to DB`,
        );
        await this.redis.del(cacheKey);
      }
    }

    const profile = await this.profileRepo.findOne({
      where: { userId, platform },
      order: { interviewVersion: 'DESC', generatedAt: 'DESC' },
    });

    if (!profile) {
      throw new NotFoundException(
        `No generated content found for ${platform}. Submit an interview first via POST /intelligence/generate.`,
      );
    }

    return { content: profile.content, cached: false };
  }

  async getAllPlatformSummary(userId: string): Promise<PlatformSummary[]> {
    const [profiles, scores] = await Promise.all([
      this.profileRepo.find({
        where: { userId },
        order: { generatedAt: 'DESC' },
      }),
      this.marketScoreRepo.find({
        where: { userId },
        order: { computedAt: 'DESC' },
      }),
    ]);

    const profileMap = new Map<SupportedPlatform, ProfileData>();
    for (const p of profiles) {
      if (!profileMap.has(p.platform)) profileMap.set(p.platform, p);
    }

    const scoreMap = new Map<SupportedPlatform, MarketScore>();
    for (const s of scores) {
      if (!scoreMap.has(s.platform)) scoreMap.set(s.platform, s);
    }

    const platforms: SupportedPlatform[] = [
      'linkedin',
      'github',
      'instagram',
      'facebook',
      'fiverr',
      'freelancer',
      'tiktok',
      'twitter',
    ];

    return Promise.all(
      platforms.map(async (platform) => {
        const profile = profileMap.get(platform) ?? null;
        const score = scoreMap.get(platform) ?? null;
        let cached = false;

        if (profile) {
          const cacheKey = `gen:${userId}:${platform}:v${String(profile.interviewVersion)}`;
          cached = (await this.redis.exists(cacheKey)) === 1;
        }

        return {
          platform,
          hasContent: profile !== null,
          qualityScore: profile?.qualityScore ?? null,
          marketScore: score?.score ?? null,
          generatedAt: profile?.generatedAt ?? null,
          cached,
        };
      }),
    );
  }

  async regenerate(
    userId: string,
    platform: SupportedPlatform,
    language: 'en' | 'fr' | 'camfranglais' = 'en',
  ): Promise<{ jobId: string; message: string }> {
    const interview = await this.interviewRepo.findOne({
      where: { userId, platform, interviewVersion: INTERVIEW_VERSION },
    });

    if (!interview) {
      throw new NotFoundException(
        `No interview found for ${platform}. Submit answers first via POST /intelligence/generate.`,
      );
    }

    // Invalidate the cache so the next read gets fresh content
    const cacheKey = `gen:${userId}:${platform}:v${String(INTERVIEW_VERSION)}`;
    await this.redis.del(cacheKey);

    const job = await this.generationQueue.add(
      'generate',
      {
        userId,
        platform,
        interviewResponseId: interview.id,
        interviewVersion: INTERVIEW_VERSION,
        userLanguage: language,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 10000 } },
    );

    this.logger.log(
      `Re-generation queued: job ${String(job.id)} for ${userId}/${platform}`,
    );

    return {
      jobId: String(job.id),
      message: `Re-generation started for ${platform}. Your content will be updated within a few minutes.`,
    };
  }

  async schedulePost(
    userId: string,
    dto: SchedulePostDto,
  ): Promise<ScheduledPost> {
    const user = await this.usersService.findById(userId);
    if (!user || !PLAN_SCHEDULE_ACCESS.has(user.plan)) {
      throw new ForbiddenException(
        'Content scheduling requires a Professional or Elite plan.',
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future.');
    }

    const { content: contentSections } = await this.getContent(
      userId,
      dto.platform,
    );

    const post = await this.scheduleRepo.save(
      this.scheduleRepo.create({
        userId,
        platform: dto.platform,
        contentSections,
        scheduledAt,
        status: 'scheduled',
      }),
    );

    const delayMs = scheduledAt.getTime() - Date.now();
    const bullJob = await this.scheduleQueue.add(
      'publish-scheduled',
      {
        userId,
        platform: dto.platform,
        automationJobId: post.id,
        layer: 'L1',
        contentSections,
        scheduledPostId: post.id,
      },
      {
        delay: delayMs,
        attempts: 3,
        backoff: { type: 'exponential', delay: 15000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    await this.scheduleRepo.update(post.id, { bullJobId: String(bullJob.id) });
    post.bullJobId = String(bullJob.id);

    this.logger.log(
      `Post scheduled: ${post.id} for ${userId}/${dto.platform} at ${scheduledAt.toISOString()}`,
    );

    return post;
  }

  async getScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    return this.scheduleRepo.find({
      where: { userId },
      order: { scheduledAt: 'ASC' },
    });
  }

  async cancelScheduledPost(
    userId: string,
    postId: string,
  ): Promise<{ message: string }> {
    const post = await this.scheduleRepo.findOne({
      where: { id: postId, userId },
    });
    if (!post) {
      throw new NotFoundException('Scheduled post not found.');
    }
    if (post.status !== 'scheduled') {
      throw new BadRequestException(
        `Cannot cancel a post with status "${post.status}".`,
      );
    }

    await this.scheduleRepo.update(postId, { status: 'cancelled' });

    // Use stored bull_job_id for O(1) lookup; fall back to full scan for
    // rows created before this column was added.
    if (post.bullJobId) {
      const bullJob = await this.scheduleQueue.getJob(post.bullJobId);
      if (bullJob) await bullJob.remove();
    } else {
      const jobs = await this.scheduleQueue.getDelayed();
      const delayed = jobs.find((j) => {
        const data = j.data as { scheduledPostId?: string };
        return data.scheduledPostId === postId;
      });
      if (delayed) await delayed.remove();
    }

    return { message: 'Scheduled post cancelled.' };
  }
}
