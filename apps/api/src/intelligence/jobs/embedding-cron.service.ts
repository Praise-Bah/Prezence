import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ProfileData } from '../entities/profile-data.entity';
import { EmbeddingService } from '../services/embedding.service';

const WINDOW_HOURS = 25; // slightly more than 24h to avoid drift gaps

@Injectable()
export class EmbeddingCronService {
  private readonly logger = new Logger(EmbeddingCronService.name);

  constructor(
    @InjectRepository(ProfileData)
    private readonly profileRepo: Repository<ProfileData>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Cron('0 2 * * *', { name: 'voice-learning', timeZone: 'UTC' })
  async runNightlyEmbedding(): Promise<void> {
    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
    const profiles = await this.profileRepo.find({
      where: { generatedAt: MoreThan(since) },
    });

    this.logger.log(
      `Voice-learning cron: processing ${profiles.length} profile(s) since ${since.toISOString()}`,
    );

    let succeeded = 0;
    let failed = 0;

    for (const profile of profiles) {
      try {
        const text = Object.values(profile.content).join('\n\n');
        await this.embeddingService.generateAndStore(
          profile.userId,
          'profile_data',
          profile.id,
          text,
          { platform: profile.platform, version: profile.interviewVersion },
        );
        succeeded++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Failed to embed profile ${profile.id} (user ${profile.userId}): ${String(err)}`,
        );
      }
    }

    this.logger.log(
      `Voice-learning cron done — ${succeeded} succeeded, ${failed} failed`,
    );
  }
}
