import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@prezence/config';
import { AuthModule } from '../auth';
import { EmailProcessor } from './jobs/email.processor';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.email }), AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, EmailProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
