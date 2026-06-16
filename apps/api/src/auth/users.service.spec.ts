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
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  describe('findByEmail', () => {
    it('queries by email', async () => {
      const user = { id: '1', email: 'a@b.com' } as User;
      repository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('a@b.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
      });
      expect(result).toBe(user);
    });
  });

  describe('findById', () => {
    it('queries by id', async () => {
      const user = { id: '1', email: 'a@b.com' } as User;
      repository.findOne.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toBe(user);
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
});
