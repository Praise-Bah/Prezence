import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job, Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import type { PlatformPublishJobData } from '@prezence/types';
import { ScheduledPost } from '../entities/scheduled-post.entity';
import { AutomationJobEntity } from '../../integration/entities/automation-job.entity';

type ScheduledJobData = PlatformPublishJobData & { scheduledPostId: string };

@Processor(QUEUE_NAMES.content_schedule)
export class ScheduledPostProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledPostProcessor.name);

  constructor(
    @InjectRepository(ScheduledPost)
    private readonly scheduleRepo: Repository<ScheduledPost>,
    @InjectRepository(AutomationJobEntity)
    private readonly automationJobRepo: Repository<AutomationJobEntity>,
    @InjectQueue(QUEUE_NAMES.automation)
    private readonly automationQueue: Queue<PlatformPublishJobData>,
  ) {
    super();
  }

  async process(job: Job<ScheduledJobData>): Promise<void> {
    const { userId, platform, contentSections, layer, scheduledPostId } =
      job.data;

    this.logger.log(
      `Processing scheduled post ${scheduledPostId} for ${userId}/${platform}`,
    );

    const post = await this.scheduleRepo.findOne({
      where: { id: scheduledPostId, userId },
    });

    if (!post || post.status === 'cancelled') {
      this.logger.log(
        `Scheduled post ${scheduledPostId} was cancelled — skipping`,
      );
      return;
    }

    await this.scheduleRepo.update(scheduledPostId, { status: 'processing' });

    try {
      const automationJob = await this.automationJobRepo.save(
        this.automationJobRepo.create({
          userId,
          platform,
          layerUsed: layer,
          status: 'queued',
        }),
      );

      await this.automationQueue.add(
        'publish',
        {
          userId,
          platform,
          automationJobId: automationJob.id,
          layer,
          contentSections,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 15000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      await this.scheduleRepo.update(scheduledPostId, {
        status: 'completed',
        automationJobId: automationJob.id,
      });

      this.logger.log(
        `Scheduled post ${scheduledPostId} dispatched as automation job ${automationJob.id}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.scheduleRepo.update(scheduledPostId, {
        status: 'failed',
        errorMessage: message,
      });
      throw err;
    }
  }
}
