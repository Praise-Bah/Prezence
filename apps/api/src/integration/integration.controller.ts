import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Redirect,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupportedPlatform } from '@prezence/types';
import { PLATFORM_DESCRIPTIONS } from '@prezence/config';
import { ALL_PLATFORMS, SUPPORTED_PLATFORM_ENUM } from '../platforms';
import { CurrentUser, Public } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { ConnectPlatformDto } from './dto/connect-platform.dto';
import { SkyvernWebhookDto } from './dto/skyvern-webhook.dto';
import { IntegrationService } from './integration.service';
import { OAuthService, type OAuthPlatform } from './services/oauth.service';

const OAUTH_PLATFORMS = new Set<string>(['linkedin', 'facebook']);

@Controller('integration')
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly oauthService: OAuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('available-platforms')
  getAvailablePlatforms() {
    return ALL_PLATFORMS.map((p) => ({
      ...p,
      description: PLATFORM_DESCRIPTIONS[p.platform] ?? '',
    }));
  }

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

  // ─── Skyvern webhook (called by self-hosted Skyvern, not by the user) ──────

  @Public()
  @Post('skyvern/webhook')
  async skyvernWebhook(
    @Headers('x-api-key') apiKey: string | undefined,
    @Body() dto: SkyvernWebhookDto,
  ): Promise<{ ok: boolean }> {
    const secret = this.config.getOrThrow<string>('SKYVERN_WEBHOOK_SECRET');
    if (!apiKey || apiKey !== secret) {
      throw new UnauthorizedException('Invalid Skyvern webhook API key');
    }
    await this.integrationService.handleSkyvernWebhook(dto);
    return { ok: true };
  }

  // ─── OAuth ──────────────────────────────────────────────────────────────────

  @Get('oauth/:platform/start')
  async oauthStart(
    @Param('platform') platform: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ authUrl: string }> {
    this.assertOAuthPlatform(platform);
    const authUrl = await this.oauthService.generateAuthUrl(
      platform as OAuthPlatform,
      user.userId,
    );
    return { authUrl };
  }

  @Public()
  @Get('oauth/:platform/callback')
  @Redirect()
  async oauthCallback(
    @Param('platform') platform: string,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oauthError: string | undefined,
  ): Promise<{ url: string }> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    if (oauthError || !code || !state) {
      return { url: `${frontendUrl}/platforms?error=${platform}_oauth_denied` };
    }

    this.assertOAuthPlatform(platform);

    const redirectUrl = await this.oauthService.handleCallback(
      platform as OAuthPlatform,
      code,
      state,
    );
    return { url: redirectUrl };
  }

  private assertOAuthPlatform(platform: string): void {
    if (!OAUTH_PLATFORMS.has(platform)) {
      throw new BadRequestException(
        `OAuth not supported for platform: ${platform}. Supported: linkedin, facebook.`,
      );
    }
  }
}
