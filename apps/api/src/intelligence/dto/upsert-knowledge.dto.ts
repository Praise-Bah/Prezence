import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import type { KnowledgeCategory } from '../entities/platform-knowledge.entity';

export class UpsertKnowledgeBodyDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  platform?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content!: string;

  @IsEnum([
    'best_practices',
    'seo_tips',
    'audience_insights',
    'character_limits',
    'general',
  ])
  @IsOptional()
  category?: KnowledgeCategory;
}
