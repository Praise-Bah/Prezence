import { Test } from '@nestjs/testing';
import { AiUsageService } from './services/ai-usage.service';
import { ChatService } from './services/chat.service';

const mockAiUsage = () => ({
  generate: jest.fn(),
});

describe('ChatService', () => {
  let service: ChatService;
  let aiUsage: ReturnType<typeof mockAiUsage>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: AiUsageService, useFactory: mockAiUsage },
      ],
    }).compile();

    service = module.get(ChatService);
    aiUsage = module.get(AiUsageService);
  });

  const mockGenerate = (content = 'reply') => {
    aiUsage.generate.mockResolvedValue({
      content,
      promptTokens: 5,
      completionTokens: 10,
      totalTokens: 15,
    });
  };

  it('sends system prompt and user message to AI', async () => {
    mockGenerate();

    await service.chat({ message: 'hello', userId: 'u1' });

    expect(aiUsage.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        task: 'generation',
        feature: 'ai-chat',
        userId: 'u1',
        messages: [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'hello' }),
        ],
        options: { max_tokens: 1024 },
      }),
    );
  });

  it('merges context into the system message when provided', async () => {
    mockGenerate();

    await service.chat({ message: 'tip', context: 'I am a developer', userId: 'u1' });

    const call = aiUsage.generate.mock.calls[0][0] as { messages: { role: string; content: string }[] };
    const systemMsg = call.messages.find((m) => m.role === 'system');
    expect(systemMsg?.content).toContain('I am a developer');
  });

  it('returns reply and token counts', async () => {
    mockGenerate('great job!');
    (aiUsage.generate as jest.Mock).mockResolvedValue({
      content: 'great job!',
      promptTokens: 3,
      completionTokens: 7,
      totalTokens: 10,
    });

    const result = await service.chat({ message: 'review my bio' });

    expect(result.reply).toBe('great job!');
    expect(result.promptTokens).toBe(3);
    expect(result.completionTokens).toBe(7);
  });

  it('works without userId (anonymous session)', async () => {
    mockGenerate();

    await service.chat({ message: 'help' });

    expect(aiUsage.generate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
    );
  });

  it('does not include context in system message when context is omitted', async () => {
    mockGenerate();

    await service.chat({ message: 'hello' });

    const call = aiUsage.generate.mock.calls[0][0] as { messages: { role: string; content: string }[] };
    const systemMsg = call.messages.find((m) => m.role === 'system');
    expect(systemMsg?.content).not.toContain('User context');
  });

  it('propagates errors from AiUsageService', async () => {
    aiUsage.generate.mockRejectedValue(new Error('OpenRouter down'));

    await expect(service.chat({ message: 'test' })).rejects.toThrow('OpenRouter down');
  });
});
