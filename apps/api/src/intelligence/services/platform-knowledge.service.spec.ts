import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { AiUsageService } from '../../ai';
import { PlatformKnowledge } from '../entities/platform-knowledge.entity';
import {
  PlatformKnowledgeService,
  type KnowledgeSimilarResult,
} from './platform-knowledge.service';

const mockEmbedding = new Array(1536).fill(0.1) as number[];

describe('PlatformKnowledgeService', () => {
  let service: PlatformKnowledgeService;
  let repo: {
    findOne: jest.Mock;
    update: jest.Mock;
    findOneOrFail: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let dataSource: { query: jest.Mock };
  let aiUsage: { embed: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      update: jest.fn(),
      findOneOrFail: jest.fn(),
      create: jest.fn((d: Partial<PlatformKnowledge>) => d),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    dataSource = { query: jest.fn() };
    aiUsage = {
      embed: jest.fn().mockResolvedValue({
        embedding: mockEmbedding,
        tokenCount: 42,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformKnowledgeService,
        { provide: getRepositoryToken(PlatformKnowledge), useValue: repo },
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: AiUsageService, useValue: aiUsage },
      ],
    }).compile();

    service = module.get(PlatformKnowledgeService);
  });

  describe('findSimilar', () => {
    it('embeds the query text and returns rows from a raw SQL pgvector query', async () => {
      const mockRows: KnowledgeSimilarResult[] = [
        {
          id: 'kb-1',
          platform: 'linkedin',
          title: 'LinkedIn Headline Best Practices',
          content: 'Lead with your strongest value proposition.',
          category: 'best_practices',
          similarity: 0.92,
        },
        {
          id: 'kb-2',
          platform: null,
          title: 'Global SEO Keywords',
          content: 'TypeScript, NestJS, Fintech Africa.',
          category: 'seo_tips',
          similarity: 0.87,
        },
      ];
      dataSource.query.mockResolvedValue(mockRows);

      const results = await service.findSimilar(
        'linkedin',
        'professional headline tips',
        3,
      );

      expect(aiUsage.embed).toHaveBeenCalledWith({
        userId: 'system',
        feature: 'platform_knowledge_retrieval',
        text: 'professional headline tips',
      });

      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('platform_knowledge'),
        expect.arrayContaining([expect.stringContaining('['), 'linkedin', 3]),
      );

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBe(0.92);
      expect(results[1].platform).toBeNull();
    });

    it('passes the platform filter so global docs (platform IS NULL) are included', async () => {
      dataSource.query.mockResolvedValue([]);

      await service.findSimilar('github', 'bio optimisation', 5);

      const [sql, params] = dataSource.query.mock.calls[0] as [
        string,
        unknown[],
      ];
      expect(sql).toContain('platform = $2 OR platform IS NULL');
      expect(params[1]).toBe('github');
      expect(params[2]).toBe(5);
    });

    it('converts the embedding array to a bracketed vector literal', async () => {
      dataSource.query.mockResolvedValue([]);

      await service.findSimilar('fiverr', 'gig description seo', 3);

      const params = dataSource.query.mock.calls[0][1] as unknown[];
      const vectorLiteral = params[0] as string;
      expect(vectorLiteral).toMatch(/^\[[\d.,\s]+\]$/);
      expect(vectorLiteral.split(',').length).toBe(1536);
    });
  });

  describe('upsert', () => {
    it('creates a new doc and embeds it when title does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      const saved = {
        id: 'new-id',
        platform: 'linkedin',
        title: 'New Doc',
        content: 'some content',
        category: 'general',
        isActive: true,
      };
      repo.save.mockResolvedValue(saved);
      dataSource.query.mockResolvedValue([]);

      const result = await service.upsert({
        platform: 'linkedin',
        title: 'New Doc',
        content: 'some content',
      });

      expect(repo.save).toHaveBeenCalled();
      expect(dataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['new-id']),
      );
      expect(result.id).toBe('new-id');
    });

    it('updates existing doc and re-embeds when title already exists', async () => {
      const existing: Partial<PlatformKnowledge> = {
        id: 'existing-id',
        platform: 'linkedin',
        title: 'Existing Doc',
        content: 'old content',
        category: 'general',
      };
      repo.findOne.mockResolvedValue(existing);
      repo.update.mockResolvedValue({ affected: 1 });
      repo.findOneOrFail.mockResolvedValue({
        ...existing,
        content: 'new content',
      });
      dataSource.query.mockResolvedValue([]);

      const result = await service.upsert({
        platform: 'linkedin',
        title: 'Existing Doc',
        content: 'new content',
      });

      expect(repo.update).toHaveBeenCalledWith(
        'existing-id',
        expect.objectContaining({ content: 'new content' }),
      );
      expect(result.content).toBe('new content');
    });
  });
});
