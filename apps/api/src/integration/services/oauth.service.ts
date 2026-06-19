import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../redis';
import { IntegrationService } from '../integration.service';

export type OAuthPlatform = 'linkedin' | 'facebook';

const STATE_TTL = 600; // 10 minutes

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly integrationService: IntegrationService,
  ) {}

  async generateAuthUrl(platform: OAuthPlatform, userId: string): Promise<string> {
    const state = randomUUID();
    await this.redis.set(`oauth:state:${state}`, userId, 'EX', STATE_TTL);

    const apiUrl = this.config.getOrThrow<string>('API_URL');
    const redirectUri = `${apiUrl}/integration/oauth/${platform}/callback`;

    return platform === 'linkedin'
      ? this.buildLinkedInUrl(state, redirectUri)
      : this.buildMetaUrl(state, redirectUri);
  }

  async handleCallback(
    platform: OAuthPlatform,
    code: string,
    state: string,
  ): Promise<string> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const stateKey = `oauth:state:${state}`;
    const userId = await this.redis.get(stateKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired OAuth state. Please try again.');
    }
    await this.redis.del(stateKey);

    const apiUrl = this.config.getOrThrow<string>('API_URL');
    const redirectUri = `${apiUrl}/integration/oauth/${platform}/callback`;

    try {
      if (platform === 'linkedin') {
        await this.exchangeLinkedIn(userId, code, redirectUri);
      } else {
        await this.exchangeMeta(userId, code, redirectUri);
      }
    } catch (err) {
      this.logger.warn(`OAuth exchange failed for ${platform} user ${userId}: ${String(err)}`);
      return `${frontendUrl}/platforms?error=${platform}_oauth_failed`;
    }

    this.logger.log(`OAuth complete: ${platform} connected for user ${userId}`);
    return `${frontendUrl}/platforms?connected=${platform}`;
  }

  private buildLinkedInUrl(state: string, redirectUri: string): string {
    const clientId = this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID');
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'openid profile email w_member_social',
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  private buildMetaUrl(state: string, redirectUri: string): string {
    const appId = this.config.getOrThrow<string>('META_APP_ID');
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      state,
      scope:
        'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish',
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  private async exchangeLinkedIn(
    userId: string,
    code: string,
    redirectUri: string,
  ): Promise<void> {
    const clientId = this.config.getOrThrow<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('LINKEDIN_CLIENT_SECRET');

    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`LinkedIn token exchange failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };

    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined;

    await this.integrationService.connect(
      userId,
      'linkedin',
      'L2',
      data.access_token,
      data.refresh_token,
      ['openid', 'profile', 'email', 'w_member_social'],
      expiresAt,
    );
  }

  private async exchangeMeta(
    userId: string,
    code: string,
    redirectUri: string,
  ): Promise<void> {
    const appId = this.config.getOrThrow<string>('META_APP_ID');
    const appSecret = this.config.getOrThrow<string>('META_APP_SECRET');

    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const res = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`,
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Meta token exchange failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
    };

    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined;

    await this.integrationService.connect(
      userId,
      'facebook',
      'L2',
      data.access_token,
      undefined,
      [
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
      ],
      expiresAt,
    );
  }
}
