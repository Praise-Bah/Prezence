import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest
              .fn()
              .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] }),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('findByEmail', () => {
    it('queries by email and excludes soft-deleted users', async () => {
      const user = { id: '1', email: 'a@b.com' } as User;
      repository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('a@b.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          email: 'a@b.com',
          deletedAt: expect.objectContaining({ _type: 'isNull' }),
        },
      });
      expect(result).toBe(user);
    });

    it('returns null when user is soft-deleted (DB returns null due to filter)', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('deleted@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('queries by id and excludes soft-deleted users', async () => {
      const user = { id: '1', email: 'a@b.com' } as User;
      repository.findOne.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: '1',
          deletedAt: expect.objectContaining({ _type: 'isNull' }),
        },
      });
      expect(result).toBe(user);
    });

    it('returns null when user is soft-deleted (DB returns null due to filter)', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById('deleted-id');

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt to a Date without hard-deleting the row', async () => {
      await service.softDelete('user-uuid');

      expect(repository.update).toHaveBeenCalledWith(
        'user-uuid',
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });

    it('does not call repository.delete', async () => {
      const deleteSpy = jest.fn();
      Object.defineProperty(repository, 'delete', {
        value: deleteSpy,
        configurable: true,
      });

      await service.softDelete('user-uuid');

      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('defaults countryCode and language and saves the entity', async () => {
      const created = { email: 'a@b.com', passwordHash: 'hash' } as User;
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue({ ...created, id: '1' });

      const result = await service.create({
        email: 'a@b.com',
        passwordHash: 'hash',
      });

      expect(repository.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        passwordHash: 'hash',
        countryCode: 'CM',
        language: 'en',
      });
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result.id).toBe('1');
    });

    it('passes through provided countryCode and language', async () => {
      const created = { email: 'a@b.com', passwordHash: 'hash' } as User;
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      await service.create({
        email: 'a@b.com',
        passwordHash: 'hash',
        countryCode: 'NG',
        language: 'fr',
      });

      expect(repository.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        passwordHash: 'hash',
        countryCode: 'NG',
        language: 'fr',
      });
    });
  });

  describe('findOrCreateSocialUser', () => {
    it('does not default countryCode to CM for new social sign-ups', async () => {
      const created = {
        email: 'social@example.com',
        passwordHash: 'hash',
        countryCode: null,
      } as User;
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue({ ...created, id: '1' });

      await service.findOrCreateSocialUser({
        email: 'social@example.com',
        name: 'Social User',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'social@example.com',
          countryCode: null,
        }),
      );
    });
  });
});
