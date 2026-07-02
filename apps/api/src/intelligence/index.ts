export { IntelligenceModule } from './intelligence.module';
export { IntelligenceService } from './intelligence.service';
export { EditSignalService } from './services/edit-signal.service';
export { PlatformKnowledgeService } from './services/platform-knowledge.service';
export { PlatformKnowledge } from './entities/platform-knowledge.entity';
export { InterviewResponse } from './entities/interview-response.entity';
export { MarketScore } from './entities/market-score.entity';
export { ProfileData } from './entities/profile-data.entity';
export { UserEditSignal } from './entities/user-edit-signal.entity';
export type { MarketFitJobData } from './jobs/market-score.processor';
export type {
  KnowledgeSimilarResult,
  UpsertKnowledgeDto,
} from './services/platform-knowledge.service';
