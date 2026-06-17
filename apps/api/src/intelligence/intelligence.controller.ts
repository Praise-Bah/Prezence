import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Request,
} from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { GenerateContentDto } from './dto/generate-content.dto';
import { IntelligenceService } from './intelligence.service';

const SupportedPlatformEnum = {
  linkedin: 'linkedin',
  github: 'github',
  instagram: 'instagram',
  facebook: 'facebook',
  fiverr: 'fiverr',
  freelancer: 'freelancer',
  tiktok: 'tiktok',
  twitter: 'twitter',
} as const;

@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

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
    @Param('platform', new ParseEnumPipe(SupportedPlatformEnum))
    platform: SupportedPlatform,
  ) {
    return this.intelligenceService.getProfile(req.user.userId, platform);
  }

  @Get('market-fit/:platform')
  async getMarketFit(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SupportedPlatformEnum))
    platform: SupportedPlatform,
  ) {
    return this.intelligenceService.getMarketFit(req.user.userId, platform);
  }
}
