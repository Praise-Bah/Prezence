import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { REDIS_CLIENT } from '../redis';
import { AuthService } from './auth.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
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
  name: null,
  bio: null,
  location: null,
  timezone: 'Africa/Douala',
  emailNotifications: true,
  pushNotifications: true,
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
  let resetTokenRepo: jest.Mocked<Repository<PasswordResetToken>>;

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
          provide: getRepositoryToken(PasswordResetToken),
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
        {
          provide: REDIS_CLIENT,
          useValue: { set: jest.fn().mockResolvedValue('OK'), del: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    lockoutService = module.get(LockoutService);
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));
    resetTokenRepo = module.get(getRepositoryToken(PasswordResetToken));

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

  describe('updateProfile', () => {
    it('updates only provided fields and returns sanitized user', async () => {
      const updated = { ...mockUser, name: 'Praise' };
      usersService.updateProfile = jest.fn().mockResolvedValue(updated);

      const result = await service.updateProfile('user-uuid', {
        name: 'Praise',
      });

      expect(usersService.updateProfile).toHaveBeenCalledWith('user-uuid', {
        name: 'Praise',
      });
      expect(result.name).toBe('Praise');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('does not overwrite fields not present in the DTO', async () => {
      const unchanged = { ...mockUser, name: 'Existing Name', bio: 'My bio' };
      usersService.updateProfile = jest.fn().mockResolvedValue(unchanged);

      const result = await service.updateProfile('user-uuid', {
        name: 'Praise',
      });

      expect(usersService.updateProfile).toHaveBeenCalledWith('user-uuid', {
        name: 'Praise',
      });
      expect(result.bio).toBe('My bio');
    });
  });

  describe('changePassword', () => {
    it('succeeds with correct current password and invalidates all sessions', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      usersService.updatePasswordHash = jest.fn().mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

      const result = await service.changePassword('user-uuid', {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass1!',
      });

      expect(result.message).toMatch(/log in again/i);
      expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
        'user-uuid',
        'new-hashed',
      );
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid' }),
        { revokedAt: expect.any(Date) },
      );
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-uuid', {
          currentPassword: 'WrongPass1!',
          newPassword: 'NewPass1!',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('invalidates all refresh tokens after password change', async () => {
      usersService.findById.mockResolvedValue(mockUser);
      usersService.updatePasswordHash = jest.fn().mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

      await service.changePassword('user-uuid', {
        currentPassword: 'OldPass1!',
        newPassword: 'NewPass1!',
      });

      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-uuid' }),
        { revokedAt: expect.any(Date) },
      );
    });
  });

  describe('forgotPassword', () => {
    it('returns generic 200 even when email does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'ghost@example.com',
      });

      expect(result.message).toMatch(/reset link/i);
    });

    it('stores hashed token (not raw token) in the database', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      resetTokenRepo.create.mockReturnValue({} as PasswordResetToken);
      resetTokenRepo.save.mockResolvedValue({} as PasswordResetToken);

      await service.forgotPassword({ email: 'a@b.com' });

      expect(resetTokenRepo.save).toHaveBeenCalled();
      const savedArg = resetTokenRepo.create.mock.calls[0][0] as {
        tokenHash: string;
      };
      expect(savedArg.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    describe('resetPassword', () => {
      const validRecord: PasswordResetToken = {
        id: 'reset-uuid',
        userId: 'user-uuid',
        tokenHash: '',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
        user: mockUser,
      };

      it('succeeds with a valid unused non-expired token', async () => {
        resetTokenRepo.findOne.mockResolvedValue(validRecord);
        usersService.updatePasswordHash = jest
          .fn()
          .mockResolvedValue(undefined);
        (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

        const result = await service.resetPassword({
          token: 'valid-raw-token',
          newPassword: 'NewPass1!',
        });

        expect(result.message).toMatch(/reset successfully/i);
        expect(usersService.updatePasswordHash).toHaveBeenCalledWith(
          'user-uuid',
          'new-hashed',
        );
      });

      it('throws BadRequestException when token is not found', async () => {
        resetTokenRepo.findOne.mockResolvedValue(null);

        await expect(
          service.resetPassword({
            token: 'bad-token',
            newPassword: 'NewPass1!',
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      });

      it('throws BadRequestException when token is expired', async () => {
        resetTokenRepo.findOne.mockResolvedValue({
          ...validRecord,
          expiresAt: new Date(Date.now() - 1000),
        });

        await expect(
          service.resetPassword({
            token: 'expired-token',
            newPassword: 'NewPass1!',
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      });

      it('throws BadRequestException when token was already used', async () => {
        resetTokenRepo.findOne.mockResolvedValue({
          ...validRecord,
          usedAt: new Date(Date.now() - 60_000),
        });

        await expect(
          service.resetPassword({
            token: 'used-token',
            newPassword: 'NewPass1!',
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      });

      it('marks token as used after successful reset', async () => {
        resetTokenRepo.findOne.mockResolvedValue(validRecord);
        usersService.updatePasswordHash = jest
          .fn()
          .mockResolvedValue(undefined);
        (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

        await service.resetPassword({
          token: 'valid-raw-token',
          newPassword: 'NewPass1!',
        });

        expect(resetTokenRepo.update).toHaveBeenCalledWith(
          { id: validRecord.id },
          { usedAt: expect.any(Date) },
        );
      });

      it('revokes all refresh tokens after successful reset', async () => {
        resetTokenRepo.findOne.mockResolvedValue(validRecord);
        usersService.updatePasswordHash = jest
          .fn()
          .mockResolvedValue(undefined);
        (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed');

        await service.resetPassword({
          token: 'valid-raw-token',
          newPassword: 'NewPass1!',
        });

        expect(refreshTokenRepo.update).toHaveBeenCalledWith(
          expect.objectContaining({ userId: 'user-uuid' }),
          { revokedAt: expect.any(Date) },
        );
      });
    });
  });
});
