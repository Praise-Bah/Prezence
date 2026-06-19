import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import type { Profile } from 'passport-facebook';
import type { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly usersService: UsersService,
    config: ConfigService,
  ) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID', 'not-configured'),
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET', 'not-configured'),
      callbackURL: `${config.get<string>('API_URL', 'http://localhost:3001')}/auth/callback/facebook`,
      profileFields: ['id', 'emails', 'displayName'],
      scope: ['email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error('Facebook did not return an email address');

    return this.usersService.findOrCreateSocialUser({
      email,
      name: profile.displayName || null,
    });
  }
}
