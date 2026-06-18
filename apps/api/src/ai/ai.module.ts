import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsageLog } from './entities/ai-usage-log.entity';
import { PromptRegistry } from './entities/prompt-registry.entity';
import { AiUsageService } from './services/ai-usage.service';
import { ModelRouterService } from './services/model-router.service';
import { PromptRegistryService } from './services/prompt-registry.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsageLog, PromptRegistry])],
  providers: [ModelRouterService, PromptRegistryService, AiUsageService],
  exports: [AiUsageService, PromptRegistryService],
})
export class AiModule {}
