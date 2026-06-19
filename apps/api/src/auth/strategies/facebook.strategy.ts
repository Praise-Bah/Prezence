import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import type { Profile } from 'passport-facebook';
import type { StateStore } from 'passport-oauth2';
import type { User } from '../entities/user.entity';
import { OAuthStateStore } from '../oauth-state.store';
import { UsersService } from '../users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly usersService: UsersService,
    config: ConfigService,
    oauthStateStore: OAuthStateStore,
  ) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID', 'not-configured'),
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET', 'not-configured'),
      callbackURL: `${config.get<string>('API_URL', 'http://localhost:3001')}/auth/callback/facebook`,
      profileFields: ['id', 'emails', 'displayName'],
      scope: ['email'],
      state: true,
      store: oauthStateStore as unknown as StateStore,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const email = profile.emails?.[0]?.value;
    if (!email)
      throw new UnauthorizedException(
        'Facebook did not return an email address',
      );

    return this.usersService.findOrCreateSocialUser({
      email,
      name: profile.displayName || null,
    });
  }
}
