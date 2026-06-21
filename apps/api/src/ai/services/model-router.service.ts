import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../../shared';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage: { prompt_tokens: number; total_tokens: number };
}

interface ChatResponse {
  choices: Array<{ message: { content: string } }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GenerateResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface EmbedResult {
  embedding: number[];
  tokenCount: number;
}

@Injectable()
export class ModelRouterService {
  private readonly logger = new Logger(ModelRouterService.name);
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  private readonly fireGenerate: (
    model: string,
    messages: OpenRouterMessage[],
    options: { max_tokens?: number },
  ) => Promise<GenerateResult>;

  private readonly fireEmbed: (
    text: string,
    model: string,
  ) => Promise<EmbedResult>;

  constructor(
    private readonly config: ConfigService,
    private readonly cb: CircuitBreakerService,
  ) {
    this.fireGenerate = cb.wrap(
      'openrouter-generate',
      (model, messages, options) => this.doGenerate(model, messages, options),
      { timeout: 60_000, volumeThreshold: 3 },
    );
    this.fireEmbed = cb.wrap(
      'openrouter-embed',
      (text, model) => this.doEmbed(text, model),
      { timeout: 15_000, volumeThreshold: 3 },
    );
  }

  async generate(
    model: string,
    messages: OpenRouterMessage[],
    options: { max_tokens?: number } = {},
  ): Promise<GenerateResult> {
    return this.fireGenerate(model, messages, options);
  }

  async embed(text: string, model: string): Promise<EmbedResult> {
    return this.fireEmbed(text, model);
  }

  private async doGenerate(
    model: string,
    messages: OpenRouterMessage[],
    options: { max_tokens?: number },
  ): Promise<GenerateResult> {
    const apiKey = this.config.getOrThrow<string>('OPENROUTER_API_KEY');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prezence.app',
        'X-Title': 'Prezence AI',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.max_tokens ?? 4096,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(
        `OpenRouter generate error: ${response.status} — ${text}`,
      );
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = (await response.json()) as ChatResponse;
    return {
      content: data.choices[0]?.message.content ?? '',
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    };
  }

  private async doEmbed(text: string, model: string): Promise<EmbedResult> {
    const apiKey = this.config.getOrThrow<string>('OPENROUTER_API_KEY');

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://prezence.app',
        'X-Title': 'Prezence AI',
      },
      body: JSON.stringify({ model, input: text }),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(
        `OpenRouter embed error: ${response.status} — ${errText}`,
      );
      throw new Error(`OpenRouter embed error: ${response.status}`);
    }

    const data = (await response.json()) as EmbeddingResponse;
    return {
      embedding: data.data[0]?.embedding ?? [],
      tokenCount: data.usage?.total_tokens ?? 0,
    };
  }
}
