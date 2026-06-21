import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import { R2StorageService } from '../billing/r2-storage.service';
import {
  ImageRecord,
  type ImagePurpose,
  type ImageVariants,
} from './image.entity';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const AVIF_WIDTHS = [320, 640, 960, 1280, 1920] as const;
const WEBP_WIDTHS = [320, 640, 960, 1280, 1920] as const;
const JPEG_WIDTHS = [640, 1280] as const;

export interface ImageUploadResult {
  imageId: string;
  baseUrl: string;
  variants: ImageVariants;
  width: number | null;
  height: number | null;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    @InjectRepository(ImageRecord)
    private readonly imageRepo: Repository<ImageRecord>,
    private readonly r2: R2StorageService,
  ) {}

  async uploadImage(
    buffer: Buffer,
    mimeType: string,
    userId: string,
    purpose: ImagePurpose,
  ): Promise<ImageUploadResult> {
    // 1. Validate MIME type
    if (!(ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported image type: ${mimeType}. Allowed: image/jpeg, image/png, image/webp`,
      );
    }

    // 2. Validate size
    if (buffer.length > MAX_BYTES) {
      throw new BadRequestException(
        `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)} MB. Maximum is 10 MB.`,
      );
    }

    // 3. Strip EXIF metadata — .rotate() with no arg forces a re-encode
    const cleaned = await sharp(buffer).rotate().toBuffer();
    const meta = await sharp(cleaned).metadata();
    const origWidth = meta.width ?? null;
    const origHeight = meta.height ?? null;

    // 4. Generate all responsive variants in parallel
    const [avifBuffers, webpBuffers, jpegBuffers] = await Promise.all([
      Promise.all(
        AVIF_WIDTHS.map((w) =>
          sharp(cleaned)
            .resize(w, null, { withoutEnlargement: true })
            .toFormat('avif', { quality: 70 })
            .toBuffer(),
        ),
      ),
      Promise.all(
        WEBP_WIDTHS.map((w) =>
          sharp(cleaned)
            .resize(w, null, { withoutEnlargement: true })
            .toFormat('webp', { quality: 75 })
            .toBuffer(),
        ),
      ),
      Promise.all(
        JPEG_WIDTHS.map((w) =>
          sharp(cleaned)
            .resize(w, null, { withoutEnlargement: true })
            .toFormat('jpeg', { quality: 80, progressive: true })
            .toBuffer(),
        ),
      ),
    ]);

    // 5. Upload all variants to R2 in parallel
    const imageId = randomUUID();
    const baseKey = `images/${userId}/${imageId}`;

    const [avifUrls, webpUrls, jpegUrls] = await Promise.all([
      Promise.all(
        AVIF_WIDTHS.map((w, i) =>
          this.r2.uploadBuffer(
            `${baseKey}/${w}w.avif`,
            avifBuffers[i],
            'image/avif',
          ),
        ),
      ),
      Promise.all(
        WEBP_WIDTHS.map((w, i) =>
          this.r2.uploadBuffer(
            `${baseKey}/${w}w.webp`,
            webpBuffers[i],
            'image/webp',
          ),
        ),
      ),
      Promise.all(
        JPEG_WIDTHS.map((w, i) =>
          this.r2.uploadBuffer(
            `${baseKey}/${w}w.jpeg`,
            jpegBuffers[i],
            'image/jpeg',
          ),
        ),
      ),
    ]);

    // 6. Build variants object
    const avif: Record<string, string> = {};
    AVIF_WIDTHS.forEach((w, i) => {
      avif[String(w)] = avifUrls[i];
    });

    const webp: Record<string, string> = {};
    WEBP_WIDTHS.forEach((w, i) => {
      webp[String(w)] = webpUrls[i];
    });

    const jpeg: Record<string, string> = {};
    JPEG_WIDTHS.forEach((w, i) => {
      jpeg[String(w)] = jpegUrls[i];
    });

    const variants: ImageVariants = { avif, webp, jpeg };

    // 640w WebP is the canonical base URL
    const baseUrl = webp['640'];

    // 7. Write record to images table
    const record = this.imageRepo.create({
      id: imageId,
      userId,
      originalKey: `${baseKey}/original`,
      baseUrl,
      variants,
      width: origWidth,
      height: origHeight,
      mimeType,
      sizeBytes: buffer.length,
      purpose,
    });
    await this.imageRepo.save(record);

    this.logger.log(
      `Image ${imageId} uploaded (purpose=${purpose}, user=${userId}, ${AVIF_WIDTHS.length + WEBP_WIDTHS.length + JPEG_WIDTHS.length} variants)`,
    );

    return { imageId, baseUrl, variants, width: origWidth, height: origHeight };
  }
}
