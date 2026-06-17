import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AI_MODELS } from '@prezence/config';
import { ModelRouterService } from './model-router.service';

export interface SimilarEmbedding {
  id: string;
  content: string;
  source_type: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly modelRouter: ModelRouterService,
  ) {}

  async generateAndStore(
    userId: string,
    sourceType: string,
    sourceId: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const { embedding, tokenCount } = await this.modelRouter.embed(
      content,
      AI_MODELS.embedding,
    );

    const vectorLiteral = `[${embedding.join(',')}]`;

    await this.dataSource.query(
      `INSERT INTO public.ai_embeddings
         (user_id, source_type, source_id, content, embedding, metadata, model_used, token_count)
       VALUES ($1, $2, $3::uuid, $4, $5::vector, $6::jsonb, $7, $8)
       ON CONFLICT DO NOTHING`,
      [
        userId,
        sourceType,
        sourceId,
        content,
        vectorLiteral,
        JSON.stringify(metadata),
        AI_MODELS.embedding,
        tokenCount,
      ],
    );

    this.logger.debug(
      `Stored embedding for ${sourceType}/${sourceId} (${tokenCount} tokens)`,
    );
  }

  async findSimilar(
    userId: string,
    text: string,
    limit = 5,
  ): Promise<SimilarEmbedding[]> {
    const { embedding } = await this.modelRouter.embed(
      text,
      AI_MODELS.embedding,
    );
    const vectorLiteral = `[${embedding.join(',')}]`;

    const rows: SimilarEmbedding[] = await this.dataSource.query(
      `SELECT id, content, source_type, metadata,
              1 - (embedding <=> $1::vector) AS similarity
       FROM public.ai_embeddings
       WHERE user_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [vectorLiteral, userId, limit],
    );

    return rows;
  }
}
