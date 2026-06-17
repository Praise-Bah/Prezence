import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { AuthModule } from '../auth';
import { NotificationModule } from '../notification';
import { AdminBillingController } from './admin-billing.controller';
import { AdminBillingService } from './admin-billing.service';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaymentEvent } from './entities/payment-event.entity';
import { SubscriptionRequest } from './entities/subscription-request.entity';
import { ScreenshotScreeningProcessor } from './jobs/screenshot-screening.processor';
import { R2StorageService } from './r2-storage.service';
import { ScreenshotScreenerService } from './screenshot-screener.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SubscriptionRequest, PaymentEvent]),
    BullModule.registerQueue({ name: QUEUE_NAMES.screenshot_screening }),
    AuthModule,
    NotificationModule,
  ],
  controllers: [BillingController, AdminBillingController],
  providers: [
    BillingService,
    AdminBillingService,
    R2StorageService,
    ScreenshotScreenerService,
    ScreenshotScreeningProcessor,
  ],
  exports: [BillingService],
})
export class BillingModule {}
