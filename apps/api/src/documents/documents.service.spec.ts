import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import { R2StorageService } from '../billing';
import { DocumentsService } from './documents.service';
import { UserDocument } from './entities/user-document.entity';

const mockFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    originalname: 'cv.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('fake-pdf'),
    ...overrides,
  }) as Express.Multer.File;

const mockDoc = (): UserDocument => ({
  id: 'doc-uuid',
  userId: 'user-uuid',
  filename: 'cv.pdf',
  mimeType: 'application/pdf',
  r2Key: 'documents/user-uuid/doc-uuid.pdf',
  fileSize: 1024,
  status: 'pending',
  category: null,
  extractedText: null,
  errorMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('DocumentsService', () => {
  let service: DocumentsService;
  let docRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  let queue: { add: jest.Mock };
  let r2: { uploadBuffer: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    docRepo = {
      create: jest.fn((data: Partial<UserDocument>) => data),
      save: jest.fn().mockResolvedValue(mockDoc()),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
    };
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'job-uuid' }),
    };
    r2 = {
      uploadBuffer: jest.fn().mockResolvedValue('https://example.com/key'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(UserDocument), useValue: docRepo },
        {
          provide: getQueueToken(QUEUE_NAMES.document_extraction),
          useValue: queue,
        },
        { provide: R2StorageService, useValue: r2 },
      ],
    }).compile();

    service = module.get(DocumentsService);
  });

  describe('upload', () => {
    it('rejects unsupported MIME type', async () => {
      await expect(
        service.upload('user-uuid', mockFile({ mimetype: 'text/plain' })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects files over 20 MB', async () => {
      await expect(
        service.upload('user-uuid', mockFile({ size: 21 * 1024 * 1024 })),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when user already has 20 documents', async () => {
      docRepo.count.mockResolvedValue(20);
      await expect(
        service.upload('user-uuid', mockFile()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('uploads to R2, saves to DB, and enqueues extraction job', async () => {
      const file = mockFile();
      const result = await service.upload('user-uuid', file);

      expect(r2.uploadBuffer).toHaveBeenCalledWith(
        expect.stringContaining('documents/user-uuid/'),
        file.buffer,
        'application/pdf',
      );
      expect(docRepo.save).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith(
        'extract',
        expect.objectContaining({
          userId: 'user-uuid',
          mimeType: 'application/pdf',
        }),
        expect.objectContaining({ attempts: 3 }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('list', () => {
    it('returns documents ordered by createdAt DESC', async () => {
      docRepo.find.mockResolvedValue([mockDoc()]);
      const result = await service.list('user-uuid');
      expect(docRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-uuid' } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when document not found', async () => {
      docRepo.findOne.mockResolvedValue(null);
      await expect(
        service.remove('user-uuid', 'missing-uuid'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes from R2 and DB when document exists', async () => {
      docRepo.findOne.mockResolvedValue(mockDoc());
      await service.remove('user-uuid', 'doc-uuid');

      expect(r2.delete).toHaveBeenCalledWith(
        'documents/user-uuid/doc-uuid.pdf',
      );
      expect(docRepo.delete).toHaveBeenCalledWith('doc-uuid');
    });
  });
});
