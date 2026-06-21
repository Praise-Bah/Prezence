import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { AiModule } from '../ai';
import { AuthModule } from '../auth';
import { R2StorageService } from '../billing/r2-storage.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { UserDocument } from './entities/user-document.entity';
import { ExtractionWorker } from './jobs/extraction.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserDocument]),
    BullModule.registerQueue({ name: QUEUE_NAMES.document_extraction }),
    AuthModule,
    AiModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, ExtractionWorker, R2StorageService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
