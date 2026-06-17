import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Request,
} from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { SUPPORTED_PLATFORM_ENUM } from '../platforms';
import { ConnectPlatformDto } from './dto/connect-platform.dto';
import { IntegrationService } from './integration.service';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('connections')
  getConnections(@Request() req: { user: { userId: string } }) {
    return this.integrationService.getConnections(req.user.userId);
  }

  @Post('connect')
  connect(
    @Request() req: { user: { userId: string } },
    @Body() dto: ConnectPlatformDto,
  ) {
    return this.integrationService.connect(
      req.user.userId,
      dto.platform,
      dto.layer,
      dto.access_token,
      dto.refresh_token,
      dto.scopes,
      dto.expires_at,
    );
  }

  @Delete('disconnect/:platform')
  disconnect(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SUPPORTED_PLATFORM_ENUM))
    platform: SupportedPlatform,
  ) {
    return this.integrationService.disconnect(req.user.userId, platform);
  }

  @Post('publish/:platform')
  publish(
    @Request() req: { user: { userId: string } },
    @Param('platform', new ParseEnumPipe(SUPPORTED_PLATFORM_ENUM))
    platform: SupportedPlatform,
  ) {
    return this.integrationService.triggerPublish(req.user.userId, platform);
  }

  @Get('jobs')
  getJobs(@Request() req: { user: { userId: string } }) {
    return this.integrationService.getJobs(req.user.userId);
  }
}
