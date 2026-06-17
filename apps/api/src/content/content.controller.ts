import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { ContentService } from './content.service';
import { RegenerateDto } from './dto/regenerate.dto';

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
    @Param('platform') platform: SupportedPlatform,
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
