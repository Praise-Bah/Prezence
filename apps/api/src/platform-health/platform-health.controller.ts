import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Post,
  Request,
} from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { SUPPORTED_PLATFORM_ENUM } from '../platforms';
import { PlatformHealthService } from './platform-health.service';

@Controller('platform-health')
export class PlatformHealthController {
  constructor(private readonly healthService: PlatformHealthService) {}

  @Get()
  getLatest(@Request() req: { user: { userId: string } }) {
    return this.healthService.getLatest(req.user.userId);
  }

  @Get(':platform')
  async getLatestForPlatform(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SUPPORTED_PLATFORM_ENUM))
    platform: SupportedPlatform,
  ) {
    const result = await this.healthService.getLatestForPlatform(
      req.user.userId,
      platform,
    );
    if (!result)
      throw new NotFoundException(`No health data for platform: ${platform}`);
    return result;
  }

  @Post('check')
  runCheck(@Request() req: { user: { userId: string } }) {
    return this.healthService.checkAll(req.user.userId);
  }
}
