import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { Roles } from '../auth';
import { SUPPORTED_PLATFORM_ENUM } from '../platforms';
import { GenerateContentDto } from './dto/generate-content.dto';
import { UpsertKnowledgeBodyDto } from './dto/upsert-knowledge.dto';
import type { PlatformKnowledge } from './entities/platform-knowledge.entity';
import { IntelligenceService } from './intelligence.service';
import { PlatformKnowledgeService } from './services/platform-knowledge.service';

@Controller('intelligence')
export class IntelligenceController {
  constructor(
    private readonly intelligenceService: IntelligenceService,
    private readonly platformKnowledge: PlatformKnowledgeService,
  ) {}

  @Post('generate')
  async generate(
    @Request() req: { user: { userId: string } },
    @Body() dto: GenerateContentDto,
  ): Promise<{ jobId: string; message: string }> {
    return this.intelligenceService.submitInterview(req.user.userId, dto);
  }

  @Get('profile/:platform')
  async getProfile(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SUPPORTED_PLATFORM_ENUM))
    platform: SupportedPlatform,
  ) {
    return this.intelligenceService.getProfile(req.user.userId, platform);
  }

  @Get('market-fit/:platform')
  async getMarketFit(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SUPPORTED_PLATFORM_ENUM))
    platform: SupportedPlatform,
  ) {
    return this.intelligenceService.getMarketFit(req.user.userId, platform);
  }

  @Post('admin/knowledge')
  @Roles('system_admin')
  async upsertKnowledge(
    @Body() dto: UpsertKnowledgeBodyDto,
  ): Promise<PlatformKnowledge> {
    return this.platformKnowledge.upsert(dto);
  }

  @Get('admin/knowledge')
  @Roles('system_admin')
  async listKnowledge(
    @Query('platform') platform?: string,
  ): Promise<PlatformKnowledge[]> {
    return this.platformKnowledge.list(platform);
  }
}
