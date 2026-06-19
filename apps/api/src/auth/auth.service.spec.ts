import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { LockoutService } from './lockout.service';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockUser: User = {
  id: 'user-uuid',
  email: 'a@b.com',
  passwordHash: 'hashed',
  role: 'user',
  plan: 'free',
  countryCode: 'CM',
  language: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockToken: RefreshToken = {
  id: 'token-uuid',
  userId: 'user-uuid',
  tokenHash: 'abc123',
  familyId: 'family-uuid',
  revokedAt: null,
  replacedBy: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  userAgent: null,
  ipHash: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let lockoutService: jest.Mocked<LockoutService>;
  let refreshTokenRepo: jest.Mocked<Repository<RefreshToken>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('signed-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
        {
          provide: LockoutService,
          useValue: {
            isLocked: jest.fn(),
            recordFailure: jest.fn(),
            reset: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.email),
          useValue: { add: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    lockoutService = module.get(LockoutService);
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));

    // Default stubs so token issuance succeeds in happy-path tests
    jwtService.signAsync.mockResolvedValue('signed-token');
    refreshTokenRepo.create.mockReturnValue(mockToken);
    refreshTokenRepo.save.mockResolvedValue(mockToken);
    refreshTokenRepo.update.mockResolvedValue({
      affected: 1,
      raw: [],
      generatedMaps: [],
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    it('throws ConflictException when email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'a@b.com', password: 'password1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes the password and creates the user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      await service.register({ email: 'a@b.com', password: 'password1' });

      expect(bcrypt.hash).toHaveBeenCalledWith('password1', 12);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com', passwordHash: 'hashed' }),
      );
    });

    it('returns sanitized user plus token pair', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'a@b.com',
        password: 'password1',
      });

      expect(result).toMatchObject({
        user: { id: 'user-uuid', email: 'a@b.com' },
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when account is locked', async () => {
      lockoutService.isLocked.mockResolvedValue(true);

      await expect(
        service.login({ email: 'a@b.com', password: 'password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('records failure and throws when user is not found', async () => {
      lockoutService.isLocked.mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'a@b.com', password: 'password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(lockoutService.recordFailure).toHaveBeenCalledWith('a@b.com');
    });

    it('records failure and throws when password is wrong', async () => {
      lockoutService.isLocked.mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(lockoutService.recordFailure).toHaveBeenCalledWith('a@b.com');
    });

    it('resets lockout and returns tokens on success', async () => {
      lockoutService.isLocked.mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'a@b.com',
        password: 'password1',
      });

      expect(lockoutService.reset).toHaveBeenCalledWith('a@b.com');
      expect(result).toMatchObject({
        user: { id: 'user-uuid' },
        accessToken: 'signed-token',
      });
    });
  });

  describe('refresh', () => {
    const rawToken = 'raw-refresh-token';

    it('throws when the JWT is invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('expired'));

      await expect(service.refresh(rawToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('revokes the family and throws on reuse of a revoked token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid',
        familyId: 'family-uuid',
      });
      // Simulate already-revoked token in DB
      refreshTokenRepo.findOne.mockResolvedValue({
        ...mockToken,
        revokedAt: new Date(),
      });

      await expect(service.refresh(rawToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { familyId: 'family-uuid' },
        { revokedAt: expect.any(Date) },
      );
    });

    it('revokes the family and throws when token is not found in DB', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid',
        familyId: 'family-uuid',
      });
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refresh(rawToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { familyId: 'family-uuid' },
        { revokedAt: expect.any(Date) },
      );
    });

    it('rotates the token and returns a new pair on valid use', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-uuid',
        familyId: 'family-uuid',
        jti: 'token-uuid',
      });
      refreshTokenRepo.findOne.mockResolvedValue(mockToken);
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.refresh(rawToken);

      expect(result).toMatchObject({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
      // Old row should be marked revoked
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { id: mockToken.id },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });
  });

  describe('logout', () => {
    it('marks the token row as revoked', async () => {
      await service.logout('some-raw-token');

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { tokenHash: expect.any(String) },
        { revokedAt: expect.any(Date) },
      );
    });
  });

  describe('logoutAll', () => {
    it('revokes all active sessions for the user', async () => {
      await service.logoutAll('user-uuid');

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid' }),
        { revokedAt: expect.any(Date) },
      );
    });
  });

  describe('sanitizeUser', () => {
    it('strips passwordHash from the output', () => {
      const result = service.sanitizeUser(mockUser);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({
        id: 'user-uuid',
        email: 'a@b.com',
        role: 'user',
      });
    });
  });
});
