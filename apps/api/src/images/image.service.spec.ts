import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { R2StorageService } from '../billing/r2-storage.service';
import { ImageRecord } from './image.entity';
import { ImageService } from './image.service';

jest.mock('sharp', () => {
  const chain = {
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('variant-data')),
    metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
  };
  return jest.fn().mockReturnValue(chain);
});

describe('ImageService', () => {
  let service: ImageService;
  let imageRepo: { create: jest.Mock; save: jest.Mock };
  let r2: { uploadBuffer: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageService,
        {
          provide: getRepositoryToken(ImageRecord),
          useValue: {
            create: jest
              .fn()
              .mockImplementation((d: Partial<ImageRecord>) => d),
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: R2StorageService,
          useValue: {
            uploadBuffer: jest
              .fn()
              .mockImplementation((key: string) =>
                Promise.resolve(`https://cdn.example.com/${key}`),
              ),
          },
        },
      ],
    }).compile();

    service = module.get(ImageService);
    imageRepo = module.get(getRepositoryToken(ImageRecord));
    r2 = module.get(R2StorageService);
  });

  const validBuffer = Buffer.from('fake-image-data');
  const validMime = 'image/jpeg';
  const userId = 'user-1';

  it('throws BadRequestException when file exceeds 10 MB', async () => {
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024);
    await expect(
      service.uploadImage(bigBuffer, validMime, userId, 'avatar'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException for unsupported MIME types', async () => {
    await expect(
      service.uploadImage(validBuffer, 'application/pdf', userId, 'avatar'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploads exactly 13 variants to R2 (5 AVIF + 5 WebP + 2 JPEG + 1 original)', async () => {
    await service.uploadImage(validBuffer, validMime, userId, 'avatar');
    expect(r2.uploadBuffer).toHaveBeenCalledTimes(13);
  });

  it('strips EXIF by calling sharp().rotate() before generating variants', async () => {
    await service.uploadImage(validBuffer, validMime, userId, 'avatar');
    const sharpMock = jest.requireMock<jest.Mock>('sharp');
    const chain = sharpMock.mock.results[0].value as { rotate: jest.Mock };
    expect(chain.rotate).toHaveBeenCalled();
  });

  it('persists the image record to the database after upload', async () => {
    await service.uploadImage(validBuffer, validMime, userId, 'avatar');
    expect(imageRepo.save).toHaveBeenCalledTimes(1);
  });

  it('returns the 640w WebP variant URL as baseUrl', async () => {
    const result = await service.uploadImage(
      validBuffer,
      validMime,
      userId,
      'avatar',
    );
    expect(result.baseUrl).toMatch(/640w\.webp$/);
  });
});
