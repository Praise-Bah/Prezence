import { Test } from '@nestjs/testing';
import { AiUsageService } from './services/ai-usage.service';
import { ChatHistoryService } from './services/chat-history.service';
import { ChatService } from './services/chat.service';

const mockAiUsage = () => ({
  generate: jest.fn(),
});

const mockChatHistory = () => ({
  findOrCreateSession: jest.fn(),
  saveMessage: jest.fn(),
});

describe('ChatService', () => {
  let service: ChatService;
  let aiUsage: ReturnType<typeof mockAiUsage>;
  let chatHistory: ReturnType<typeof mockChatHistory>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: AiUsageService, useFactory: mockAiUsage },
        { provide: ChatHistoryService, useFactory: mockChatHistory },
      ],
    }).compile();

    service = module.get(ChatService);
    aiUsage = module.get(AiUsageService);
    chatHistory = module.get(ChatHistoryService);
  });

  const mockGenerate = (content = 'reply') => {
    aiUsage.generate.mockResolvedValue({
      content,
      promptTokens: 5,
      completionTokens: 10,
      totalTokens: 15,
    });
  };

  const mockSession = () => {
    chatHistory.findOrCreateSession.mockResolvedValue({ id: 'sess-1' });
    chatHistory.saveMessage.mockResolvedValue({});
  };

  it('sends system prompt and user message to AI', async () => {
    mockGenerate();
    mockSession();

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
    mockSession();

    await service.chat({
      message: 'tip',
      context: 'I am a developer',
      userId: 'u1',
    });

    const call = aiUsage.generate.mock.calls[0][0] as {
      messages: { role: string; content: string }[];
    };
    const systemMsg = call.messages.find((m) => m.role === 'system');
    expect(systemMsg?.content).toContain('I am a developer');
  });

  it('returns reply and token counts', async () => {
    mockSession();
    aiUsage.generate.mockResolvedValue({
      content: 'great job!',
      promptTokens: 3,
      completionTokens: 7,
      totalTokens: 10,
    });

    const result = await service.chat({
      message: 'review my bio',
      userId: 'u1',
    });

    expect(result.reply).toBe('great job!');
    expect(result.promptTokens).toBe(3);
    expect(result.completionTokens).toBe(7);
  });

  it('returns the sessionId when userId is provided', async () => {
    mockGenerate();
    mockSession();

    const result = await service.chat({ message: 'hello', userId: 'u1' });

    expect(result.sessionId).toBe('sess-1');
  });

  it('returns null sessionId for anonymous sessions', async () => {
    mockGenerate();

    const result = await service.chat({ message: 'help' });

    expect(result.sessionId).toBeNull();
    expect(chatHistory.findOrCreateSession).not.toHaveBeenCalled();
  });

  it('persists user message before calling AI', async () => {
    mockGenerate();
    mockSession();

    await service.chat({ message: 'hello', userId: 'u1' });

    const saveOrder = chatHistory.saveMessage.mock.invocationCallOrder[0];
    const generateOrder = aiUsage.generate.mock.invocationCallOrder[0];
    expect(saveOrder).toBeLessThan(generateOrder);
    expect(chatHistory.saveMessage).toHaveBeenCalledWith(
      'sess-1',
      'user',
      'hello',
    );
  });

  it('persists assistant reply after AI responds', async () => {
    mockGenerate('great answer');
    mockSession();

    await service.chat({ message: 'hello', userId: 'u1' });

    expect(chatHistory.saveMessage).toHaveBeenCalledWith(
      'sess-1',
      'assistant',
      'great answer',
      15,
    );
  });

  it('uses provided platform for session lookup', async () => {
    mockGenerate();
    mockSession();

    await service.chat({ message: 'help', userId: 'u1', platform: 'linkedin' });

    expect(chatHistory.findOrCreateSession).toHaveBeenCalledWith(
      'u1',
      'linkedin',
    );
  });

  it('defaults platform to general', async () => {
    mockGenerate();
    mockSession();

    await service.chat({ message: 'help', userId: 'u1' });

    expect(chatHistory.findOrCreateSession).toHaveBeenCalledWith(
      'u1',
      'general',
    );
  });

  it('does not include context in system message when context is omitted', async () => {
    mockGenerate();
    mockSession();

    await service.chat({ message: 'hello', userId: 'u1' });

    const call = aiUsage.generate.mock.calls[0][0] as {
      messages: { role: string; content: string }[];
    };
    const systemMsg = call.messages.find((m) => m.role === 'system');
    expect(systemMsg?.content).not.toContain('User context');
  });

  it('propagates errors from AiUsageService', async () => {
    mockSession();
    aiUsage.generate.mockRejectedValue(new Error('OpenRouter down'));

    await expect(
      service.chat({ message: 'test', userId: 'u1' }),
    ).rejects.toThrow('OpenRouter down');
  });
});
