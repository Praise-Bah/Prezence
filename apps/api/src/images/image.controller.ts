import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { ImageService, type ImageUploadResult } from './image.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ImageUploadResult> {
    if (!file) {
      throw new BadRequestException(
        'No file provided or unsupported type. Accepted: JPEG, PNG, WebP.',
      );
    }
    return this.imageService.uploadImage(
      file.buffer,
      file.mimetype,
      user.userId,
      'avatar',
    );
  }
}
