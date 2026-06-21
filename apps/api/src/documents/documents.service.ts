import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import type { Queue } from 'bullmq';
import type { Express } from 'express';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import type { DocumentCategory } from '@prezence/types';
import { R2StorageService } from '../billing';
import { UserDocument } from './entities/user-document.entity';
import type { ExtractionJobData } from './jobs/extraction.worker';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_DOCUMENTS_PER_USER = 20;

const ALLOWED_CATEGORIES = new Set<DocumentCategory>([
  'cv',
  'certification',
  'portfolio',
  'reference_letters',
  'awards',
  'other',
]);

const CATEGORY_LIMITS: Partial<Record<DocumentCategory, number>> = {
  certification: 5,
};

function parseCategory(raw?: string): DocumentCategory | null {
  if (!raw?.trim()) return null;
  const value = raw.trim() as DocumentCategory;
  if (!ALLOWED_CATEGORIES.has(value)) {
    throw new BadRequestException(`Invalid document category "${raw}".`);
  }
  return value;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(UserDocument)
    private readonly docRepo: Repository<UserDocument>,
    @InjectQueue(QUEUE_NAMES.document_extraction)
    private readonly extractionQueue: Queue<ExtractionJobData>,
    private readonly r2: R2StorageService,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
    categoryRaw?: string,
  ): Promise<UserDocument> {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const category = parseCategory(categoryRaw);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not supported. Allowed: PDF, DOCX, JPEG, PNG, WebP.`,
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(`File size exceeds the 20 MB limit.`);
    }

    const count = await this.docRepo.count({ where: { userId } });
    if (count >= MAX_DOCUMENTS_PER_USER) {
      throw new BadRequestException(
        `Maximum of ${MAX_DOCUMENTS_PER_USER} documents per user reached.`,
      );
    }

    if (category) {
      const categoryLimit = CATEGORY_LIMITS[category];
      if (categoryLimit !== undefined) {
        const categoryCount = await this.docRepo.count({
          where: { userId, category },
        });
        if (categoryCount >= categoryLimit) {
          throw new BadRequestException(
            `Maximum of ${categoryLimit} documents for "${category}" reached.`,
          );
        }
      }
    }

    const documentId = randomUUID();
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const r2Key = `documents/${userId}/${documentId}.${ext}`;

    await this.r2.uploadBuffer(r2Key, file.buffer, file.mimetype);

    const doc = await this.docRepo.save(
      this.docRepo.create({
        id: documentId,
        userId,
        filename: file.originalname,
        mimeType: file.mimetype,
        r2Key,
        fileSize: file.size,
        status: 'pending',
        category,
      }),
    );

    await this.extractionQueue.add(
      'extract',
      {
        documentId,
        userId,
        r2Key,
        mimeType: file.mimetype,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(
      `Document ${documentId} uploaded for user ${userId}, extraction queued`,
    );
    return doc;
  }

  async list(userId: string): Promise<UserDocument[]> {
    return this.docRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        fileSize: true,
        status: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(userId: string, documentId: string): Promise<void> {
    const doc = await this.docRepo.findOne({
      where: { id: documentId, userId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found.');
    }

    await this.r2.delete(doc.r2Key);
    await this.docRepo.delete(documentId);

    this.logger.log(`Document ${documentId} deleted for user ${userId}`);
  }
}
