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
import { SUPPORTED_PLATFORM_ENUM } from '../platforms';
import { ContentService } from './content.service';
import { RegenerateDto } from './dto/regenerate.dto';

const SUPPORTED_PLATFORM_ENUM = {
  linkedin: 'linkedin',
  github: 'github',
  instagram: 'instagram',
  facebook: 'facebook',
  fiverr: 'fiverr',
  freelancer: 'freelancer',
  tiktok: 'tiktok',
  twitter: 'twitter',
} as const satisfies Record<SupportedPlatform, SupportedPlatform>;

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  getAllSummary(@Request() req: { user: { userId: string } }) {
    return this.contentService.getAllPlatformSummary(req.user.userId);
  }

  @Get(':platform')
  getContent(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SUPPORTED_PLATFORM_ENUM))
    platform: SupportedPlatform,
  ) {
    return this.contentService.getContent(req.user.userId, platform);
  }

  @Post('regenerate')
  regenerate(
    @Request() req: { user: { userId: string } },
    @Body() dto: RegenerateDto,
  ) {
    return this.contentService.regenerate(
      req.user.userId,
      dto.platform,
      dto.language,
    );
  }
}
