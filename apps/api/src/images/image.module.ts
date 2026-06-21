import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { R2StorageService } from '../billing/r2-storage.service';
import { ImageController } from './image.controller';
import { ImageRecord } from './image.entity';
import { ImageService } from './image.service';

// R2StorageService is registered locally here (ConfigService is global)
// so ImageModule stays leaf-level — no import of BillingModule avoids cycles
// when BillingModule imports ImageModule for screenshot processing.
@Module({
  imports: [TypeOrmModule.forFeature([ImageRecord])],
  controllers: [ImageController],
  providers: [ImageService, R2StorageService],
  exports: [ImageService],
})
export class ImageModule {}
