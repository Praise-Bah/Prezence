import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import type { Profile } from 'passport-google-oauth20';
import type { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly usersService: UsersService,
    config: ConfigService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', 'not-configured'),
      clientSecret: config.get<string>(
        'GOOGLE_CLIENT_SECRET',
        'not-configured',
      ),
      callbackURL: `${config.get<string>('API_URL', 'http://localhost:3001')}/auth/callback/google`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<User> {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new Error('Google did not return an email address');

    return this.usersService.findOrCreateSocialUser({
      email,
      name: profile.displayName || null,
    });
  }
}
