import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@prezence/config';
import { AuthModule } from '../auth/auth.module';
import { EmailProcessor } from './jobs/email.processor';
import { NotificationService } from './notification.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.email }), AuthModule],
  providers: [NotificationService, EmailProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
