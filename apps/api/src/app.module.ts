import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai';
import { AuthModule, JwtAuthGuard, RateLimitGuard, RolesGuard } from './auth';
import { BillingModule } from './billing';
import { DocumentsModule } from './documents';
import { ImageModule } from './images';
import { ContentModule } from './content';
import { EventsModule } from './events';
import { IntelligenceModule } from './intelligence';
import { IntegrationModule } from './integration';
import { NotificationModule } from './notification';
import { PlatformHealthModule } from './platform-health';
import { validate } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AiModule,
    AuthModule,
    BillingModule,
    DocumentsModule,
    ImageModule,
    EventsModule,
    IntelligenceModule,
    ContentModule,
    IntegrationModule,
    PlatformHealthModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
