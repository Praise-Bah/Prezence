import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { BillingService } from './billing.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { SubmitProofDto } from './dto/submit-proof.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('initiate')
  initiate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    return this.billingService.initiate(user.userId, dto);
  }

  @Post('submit-proof')
  @UseInterceptors(
    FileInterceptor('screenshot', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
      },
    }),
  )
  submitProof(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitProofDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.billingService.submitProof(user.userId, dto, file);
  }

  @Get('status')
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getStatus(user.userId);
  }
}
