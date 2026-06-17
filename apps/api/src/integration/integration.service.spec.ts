import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { ContentService } from '../content';
import { AutomationJobEntity } from './entities/automation-job.entity';
import { PlatformConnection } from './entities/platform-connection.entity';
import { TokenVaultService } from './services/token-vault.service';
import { IntegrationService } from './integration.service';

const mockConnectionRepo = () => ({
  upsert: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
});

const mockJobRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const mockQueue = () => ({ add: jest.fn() });

const mockTokenVault = () => ({
  encrypt: jest.fn().mockReturnValue({ ciphertext: 'c', iv: 'i', tag: 't' }),
  decrypt: jest.fn().mockReturnValue('decrypted-token'),
});

const mockContentService = () => ({
  getContent: jest.fn(),
});

describe('IntegrationService', () => {
  let service: IntegrationService;
  let connectionRepo: ReturnType<typeof mockConnectionRepo>;
  let jobRepo: ReturnType<typeof mockJobRepo>;
  let queue: ReturnType<typeof mockQueue>;
  let contentService: ReturnType<typeof mockContentService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        IntegrationService,
        {
          provide: getRepositoryToken(PlatformConnection),
          useFactory: mockConnectionRepo,
        },
        {
          provide: getRepositoryToken(AutomationJobEntity),
          useFactory: mockJobRepo,
        },
        {
          provide: getQueueToken(QUEUE_NAMES.automation),
          useFactory: mockQueue,
        },
        { provide: TokenVaultService, useFactory: mockTokenVault },
        { provide: ContentService, useFactory: mockContentService },
      ],
    }).compile();

    service = module.get(IntegrationService);
    connectionRepo = module.get(getRepositoryToken(PlatformConnection));
    jobRepo = module.get(getRepositoryToken(AutomationJobEntity));
    queue = module.get(getQueueToken(QUEUE_NAMES.automation));
    contentService = module.get(ContentService);
  });

  describe('connect', () => {
    it('encrypts access token and upserts connection', async () => {
      await service.connect('user-1', 'github', 'L1', 'ghp_token');
      expect(connectionRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          platform: 'github',
          layerUsed: 'L1',
          status: 'active',
          accessTokenCiphertext: 'c',
          accessTokenIv: 'i',
          accessTokenTag: 't',
        }),
        ['userId', 'platform'],
      );
    });

    it('encrypts refresh token when provided', async () => {
      await service.connect('user-1', 'linkedin', 'L2', 'access', 'refresh');
      expect(connectionRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshTokenCiphertext: 'c',
          refreshTokenIv: 'i',
          refreshTokenTag: 't',
        }),
        ['userId', 'platform'],
      );
    });
  });

  describe('disconnect', () => {
    it('revokes an existing connection', async () => {
      connectionRepo.findOne.mockResolvedValue({ id: 'conn-1' });
      await service.disconnect('user-1', 'github');
      expect(connectionRepo.update).toHaveBeenCalledWith('conn-1', {
        status: 'revoked',
      });
    });

    it('throws NotFoundException when connection does not exist', async () => {
      connectionRepo.findOne.mockResolvedValue(null);
      await expect(service.disconnect('user-1', 'github')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getConnections', () => {
    it('returns all connections for a user', async () => {
      const conns = [{ id: 'c1' }, { id: 'c2' }];
      connectionRepo.find.mockResolvedValue(conns);
      const result = await service.getConnections('user-1');
      expect(result).toEqual(conns);
    });
  });

  describe('triggerPublish', () => {
    it('enqueues a publish job and returns jobId', async () => {
      connectionRepo.findOne.mockResolvedValue({
        id: 'conn-1',
        layerUsed: 'L1',
      });
      contentService.getContent.mockResolvedValue({
        content: { bio: 'hello' },
        cached: false,
      });
      const savedJob = { id: 'job-uuid' };
      jobRepo.create.mockReturnValue(savedJob);
      jobRepo.save.mockResolvedValue(savedJob);

      const result = await service.triggerPublish('user-1', 'github');
      expect(result).toEqual({ jobId: 'job-uuid' });
      expect(queue.add).toHaveBeenCalledWith(
        'publish',
        expect.objectContaining({
          userId: 'user-1',
          platform: 'github',
          automationJobId: 'job-uuid',
          contentSections: { bio: 'hello' },
        }),
        expect.any(Object),
      );
    });

    it('throws ConflictException when no active connection exists', async () => {
      connectionRepo.findOne.mockResolvedValue(null);
      await expect(service.triggerPublish('user-1', 'github')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws when no content has been generated', async () => {
      connectionRepo.findOne.mockResolvedValue({
        id: 'conn-1',
        layerUsed: 'L1',
      });
      contentService.getContent.mockRejectedValue(
        new NotFoundException('no content'),
      );
      await expect(service.triggerPublish('user-1', 'github')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
