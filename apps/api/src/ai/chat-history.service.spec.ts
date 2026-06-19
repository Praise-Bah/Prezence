import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatHistoryService } from './services/chat-history.service';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage } from './entities/chat-message.entity';

const mockSession = (): ChatSession =>
  ({ id: 'sess-1', userId: 'u1', platform: 'general' }) as ChatSession;

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;
  let sessions: ReturnType<typeof mockRepo>;
  let messages: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        { provide: getRepositoryToken(ChatSession), useFactory: mockRepo },
        { provide: getRepositoryToken(ChatMessage), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(ChatHistoryService);
    sessions = module.get(getRepositoryToken(ChatSession));
    messages = module.get(getRepositoryToken(ChatMessage));
  });

  describe('findOrCreateSession', () => {
    it('returns existing session when found', async () => {
      const sess = mockSession();
      sessions.findOne.mockResolvedValue(sess);

      const result = await service.findOrCreateSession('u1', 'general');

      expect(result).toBe(sess);
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('creates and saves a new session when none exists', async () => {
      const newSess = mockSession();
      sessions.findOne.mockResolvedValue(null);
      sessions.create.mockReturnValue(newSess);
      sessions.save.mockResolvedValue(newSess);

      const result = await service.findOrCreateSession('u1', 'general');

      expect(sessions.create).toHaveBeenCalledWith({
        userId: 'u1',
        platform: 'general',
      });
      expect(sessions.save).toHaveBeenCalledWith(newSess);
      expect(result).toBe(newSess);
    });
  });

  describe('saveMessage', () => {
    it('persists message and touches session updated_at', async () => {
      const msg = {
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'user',
        content: 'hello',
      };
      messages.create.mockReturnValue(msg);
      messages.save.mockResolvedValue(msg);
      sessions.update.mockResolvedValue(undefined);

      const result = await service.saveMessage('sess-1', 'user', 'hello');

      expect(messages.create).toHaveBeenCalledWith({
        sessionId: 'sess-1',
        role: 'user',
        content: 'hello',
        tokensUsed: 0,
      });
      expect(messages.save).toHaveBeenCalledWith(msg);
      expect(sessions.update).toHaveBeenCalledWith(
        'sess-1',
        expect.objectContaining({ updatedAt: expect.any(Date) }),
      );
      expect(result).toBe(msg);
    });

    it('stores provided tokensUsed', async () => {
      const msg = { id: 'm2' };
      messages.create.mockReturnValue(msg);
      messages.save.mockResolvedValue(msg);
      sessions.update.mockResolvedValue(undefined);

      await service.saveMessage('sess-1', 'assistant', 'reply', 42);

      expect(messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ tokensUsed: 42 }),
      );
    });
  });

  describe('getHistory', () => {
    it('returns empty array when session does not exist', async () => {
      sessions.findOne.mockResolvedValue(null);

      const result = await service.getHistory('u1', 'general');

      expect(result).toEqual([]);
      expect(messages.find).not.toHaveBeenCalled();
    });

    it('fetches messages ordered by createdAt ascending', async () => {
      sessions.findOne.mockResolvedValue(mockSession());
      const msgs = [{ id: 'm1' }, { id: 'm2' }];
      messages.find.mockResolvedValue(msgs);

      const result = await service.getHistory('u1', 'general', 25);

      expect(messages.find).toHaveBeenCalledWith({
        where: { sessionId: 'sess-1' },
        order: { createdAt: 'ASC' },
        take: 25,
      });
      expect(result).toBe(msgs);
    });

    it('defaults limit to 50', async () => {
      sessions.findOne.mockResolvedValue(mockSession());
      messages.find.mockResolvedValue([]);

      await service.getHistory('u1', 'general');

      expect(messages.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });
  });
});
