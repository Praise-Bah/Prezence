import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { QUEUE_NAMES } from '@prezence/config';
import * as pdfParseModule from 'pdf-parse';
import * as mammoth from 'mammoth';

type PdfParseFunc = (b: Buffer) => Promise<{ text: string }>;
// pdf-parse 2.x exports a CJS callable — cast to bypass nodenext interop gap
const pdfParse = pdfParseModule as unknown as PdfParseFunc;
import { AiUsageService } from '../../ai';
import { UserDocument } from '../entities/user-document.entity';

export interface ExtractionJobData {
  documentId: string;
  userId: string;
  r2Key: string;
  mimeType: string;
  fileBuffer: number[]; // Buffer serialised as number array for BullMQ JSON serialisation
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

@Injectable()
@Processor(QUEUE_NAMES.document_extraction)
export class ExtractionWorker extends WorkerHost {
  private readonly logger = new Logger(ExtractionWorker.name);

  constructor(
    @InjectRepository(UserDocument)
    private readonly docRepo: Repository<UserDocument>,
    private readonly aiUsage: AiUsageService,
  ) {
    super();
  }

  async process(job: Job<ExtractionJobData>): Promise<void> {
    const { documentId, userId, mimeType, fileBuffer } = job.data;

    await this.docRepo.update(documentId, { status: 'extracting' });

    try {
      const buffer = Buffer.from(fileBuffer);
      const text = await this.extractText(userId, mimeType, buffer);

      await this.docRepo.update(documentId, {
        status: 'done',
        extractedText: text,
        errorMessage: null,
      });

      this.logger.log(
        `Extraction complete for document ${documentId} (${mimeType})`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.docRepo.update(documentId, {
        status: 'failed',
        errorMessage: message,
      });
      this.logger.warn(
        `Extraction failed for document ${documentId}: ${message}`,
      );
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ExtractionJobData>): void {
    this.logger.error(
      `Document extraction job ${job.id} exhausted all retries — documentId=${job.data.documentId}`,
    );
  }

  private async extractText(
    userId: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<string> {
    if (mimeType === 'application/pdf') {
      return this.extractPdf(buffer);
    }

    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.extractDocx(buffer);
    }

    if (mimeType.startsWith('image/')) {
      return this.extractImage(userId, buffer, mimeType);
    }

    throw new Error(`Unsupported MIME type for extraction: ${mimeType}`);
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  private async extractImage(
    userId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const base64 = buffer.toString('base64');
    const prompt = `Extract all readable text from this document image. Return only the extracted text with no commentary.`;

    const { content: raw } = await this.aiUsage.generate({
      task: 'scoring',
      userId,
      feature: 'document_extraction',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            { type: 'text', text: prompt },
          ] as never,
        },
      ],
      options: { max_tokens: 4096 },
    });

    return stripCodeFences(raw);
  }
}
