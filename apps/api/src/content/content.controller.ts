import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import type { AuthenticatedUser } from '../auth';
import { CurrentUser } from '../auth';
import { SUPPORTED_PLATFORM_ENUM } from '../platforms';
import { ContentService } from './content.service';
import { RegenerateDto } from './dto/regenerate.dto';
import { SchedulePostDto } from './dto/schedule-post.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  getAllSummary(@Request() req: { user: { userId: string } }) {
    return this.contentService.getAllPlatformSummary(req.user.userId);
  }

  // Static routes must come before @Get(':platform') so Nest doesn't treat
  // the literal path segment "schedule" as a platform slug.
  @Get('schedule')
  getScheduledPosts(@Request() req: { user: { userId: string } }) {
    return this.contentService.getScheduledPosts(req.user.userId);
  }

  @Post('schedule')
  schedulePost(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SchedulePostDto,
  ) {
    return this.contentService.schedulePost(user.userId, user.plan, dto);
  }

  @Delete('schedule/:id')
  cancelScheduledPost(
    @Request() req: { user: { userId: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contentService.cancelScheduledPost(req.user.userId, id);
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

  @Get(':platform')
  getContent(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SUPPORTED_PLATFORM_ENUM))
    platform: SupportedPlatform,
  ) {
    return this.contentService.getContent(req.user.userId, platform);
  }
}
