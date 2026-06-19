import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationJobEntity } from '../integration/entities/automation-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AutomationJobEntity])],
  exports: [TypeOrmModule],
})
export class SharedModule {}
