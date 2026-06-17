import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import { QUEUE_NAMES } from '@prezence/config';
import { UsersService } from '../../auth/users.service';
import { renderTemplate } from '../email-templates';
import type { EmailJobData } from '../notification.service';

@Processor(QUEUE_NAMES.email)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { userId, type, data } = job.data;

    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY not set — skipping ${type} email for user ${userId}`,
      );
      return;
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.warn(`User ${userId} not found — skipping ${type} email`);
      return;
    }

    const { subject, html } = renderTemplate(type, {
      ...data,
      name: user.email.split('@')[0],
    });
    const from =
      this.config.get<string>('NOTIFICATIONS_FROM_EMAIL') ??
      'Prezence <noreply@prezence.app>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: user.email, subject, html }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(
        `Resend API error ${String(response.status)} for ${type}: ${text}`,
      );
      throw new Error(`Resend error: ${String(response.status)}`);
    }

    this.logger.log(`Sent ${type} email to ${user.email}`);
  }
}
