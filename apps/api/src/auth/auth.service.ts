import { randomUUID, createHash } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Queue } from 'bullmq';
import { IsNull, Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import type { User } from './entities/user.entity';
import type { JwtPayload, RefreshTokenPayload } from './jwt-payload.interface';
import { LockoutService } from './lockout.service';
import { UsersService } from './users.service';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_COST = 12;
const DUMMY_PASSWORD_HASH =
  '$2b$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  role: string;
  plan: string;
  countryCode: string;
  language: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  timezone: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly lockoutService: LockoutService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectQueue(QUEUE_NAMES.email)
    private readonly emailQueue: Queue,
  ) {}

  sanitizeUser(user: User): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      countryCode: user.countryCode,
      language: user.language,
      name: user.name,
      bio: user.bio,
      location: user.location,
      timezone: user.timezone,
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
    };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ user: SanitizedUser } & TokenPair> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      countryCode: dto.countryCode,
      language: dto.language,
    });

    const tokens = await this.issueTokenPair(user, randomUUID());

    this.emailQueue
      .add('send', { userId: user.id, type: 'user_registered', data: {} }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      })
      .catch((err: unknown) => {
        this.logger.warn(`Failed to enqueue welcome email for ${user.id}: ${String(err)}`);
      });

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<{ user: SanitizedUser } & TokenPair> {
    if (await this.lockoutService.isLocked(dto.email)) {
      throw new UnauthorizedException(
        'Account temporarily locked due to too many failed attempts',
      );
    }

    const user = await this.usersService.findByEmail(dto.email);
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches) {
      await this.lockoutService.recordFailure(dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.lockoutService.reset(dto.email);

    const tokens = await this.issueTokenPair(user, randomUUID());

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt !== null) {
      // Reuse of a rotated/unknown token: revoke the whole session family.
      await this.refreshTokenRepository.update(
        { familyId: payload.familyId },
        { revokedAt: new Date() },
      );
      this.logger.warn(
        `Refresh token reuse detected for family ${payload.familyId}`,
      );
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const tokens = await this.issueTokenPair(user, payload.familyId, stored);

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokenRepository.update(
      { tokenHash },
      { revokedAt: new Date() },
    );
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<SanitizedUser> {
    const updated = await this.usersService.updateProfile(userId, dto);
    return this.sanitizeUser(updated);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);
    await this.usersService.updatePasswordHash(userId, newHash);
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return { message: 'Password changed. Please log in again.' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokenPair(
    user: User,
    familyId: string,
    previous?: RefreshToken,
  ): Promise<TokenPair> {
    const basePayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const jti = randomUUID();

    const accessToken = await this.jwtService.signAsync(basePayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshPayload: RefreshTokenPayload = {
      ...basePayload,
      jti,
      familyId,
    };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TOKEN_TTL,
    });

    const newRow = this.refreshTokenRepository.create({
      id: jti,
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
      replacedBy: null,
    });
    await this.refreshTokenRepository.save(newRow);

    if (previous) {
      await this.refreshTokenRepository.update(
        { id: previous.id },
        { revokedAt: new Date(), replacedBy: newRow.id },
      );
    }

    return { accessToken, refreshToken };
  }
}
