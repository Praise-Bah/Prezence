import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { AI_MODELS } from '@prezence/config';
import { AiUsageService } from '../../ai';
import type { KnowledgeCategory } from '../entities/platform-knowledge.entity';
import { PlatformKnowledge } from '../entities/platform-knowledge.entity';

export interface KnowledgeSimilarResult {
  id: string;
  platform: string | null;
  title: string;
  content: string;
  category: string;
  similarity: number;
}

export interface UpsertKnowledgeDto {
  platform?: string | null;
  title: string;
  content: string;
  category?: KnowledgeCategory;
}

@Injectable()
export class PlatformKnowledgeService {
  private readonly logger = new Logger(PlatformKnowledgeService.name);

  constructor(
    @InjectRepository(PlatformKnowledge)
    private readonly repo: Repository<PlatformKnowledge>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly aiUsage: AiUsageService,
  ) {}

  async upsert(dto: UpsertKnowledgeDto): Promise<PlatformKnowledge> {
    const platformFilter =
      dto.platform != null
        ? { platform: dto.platform }
        : { platform: IsNull() };
    const existing = await this.repo.findOne({
      where: { title: dto.title, ...platformFilter },
    });

    if (existing) {
      await this.repo.update(existing.id, {
        content: dto.content,
        category: dto.category ?? 'general',
      });
      await this.embedDoc(existing.id, dto.content);
      return this.repo.findOneOrFail({ where: { id: existing.id } });
    }

    const doc = await this.repo.save(
      this.repo.create({
        platform: dto.platform ?? null,
        title: dto.title,
        content: dto.content,
        category: dto.category ?? 'general',
        isActive: true,
      }),
    );
    await this.embedDoc(doc.id, dto.content);
    return doc;
  }

  async list(platform?: string): Promise<PlatformKnowledge[]> {
    const qb = this.repo
      .createQueryBuilder('pk')
      .where('pk.isActive = true')
      .orderBy('pk.platform', 'ASC')
      .addOrderBy('pk.category', 'ASC');

    if (platform) {
      qb.andWhere('(pk.platform = :platform OR pk.platform IS NULL)', {
        platform,
      });
    }

    return qb.getMany();
  }

  async findSimilar(
    platform: string,
    queryText: string,
    limit = 3,
  ): Promise<KnowledgeSimilarResult[]> {
    const { embedding } = await this.aiUsage.embed({
      userId: 'system',
      feature: 'platform_knowledge_retrieval',
      text: queryText,
    });

    const vectorLiteral = `[${embedding.join(',')}]`;

    const rows: KnowledgeSimilarResult[] = await this.dataSource.query(
      `SELECT id, platform, title, content, category,
              1 - (embedding <=> $1::vector) AS similarity
       FROM public.platform_knowledge
       WHERE (platform = $2 OR platform IS NULL)
         AND is_active = true
         AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      [vectorLiteral, platform, limit],
    );

    return rows;
  }

  private async embedDoc(docId: string, content: string): Promise<void> {
    try {
      const { embedding, tokenCount } = await this.aiUsage.embed({
        userId: 'system',
        feature: 'platform_knowledge_embed',
        text: content,
      });

      const vectorLiteral = `[${embedding.join(',')}]`;
      await this.dataSource.query(
        `UPDATE public.platform_knowledge
         SET embedding = $1::vector, updated_at = now()
         WHERE id = $2`,
        [vectorLiteral, docId],
      );

      this.logger.debug(
        `Embedded platform knowledge doc ${docId} (${tokenCount} tokens, model: ${AI_MODELS.embedding})`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to embed platform knowledge doc ${docId}: ${String(err)}`,
      );
    }
  }
}
