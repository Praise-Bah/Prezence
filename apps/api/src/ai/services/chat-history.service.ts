import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessage, type ChatRole } from '../entities/chat-message.entity';

const DEFAULT_HISTORY_LIMIT = 50;

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectRepository(ChatSession)
    private readonly sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
  ) {}

  async findOrCreateSession(
    userId: string,
    platform: string,
  ): Promise<ChatSession> {
    const existing = await this.sessions.findOne({
      where: { userId, platform },
    });
    if (existing) return existing;
    return this.sessions.save(this.sessions.create({ userId, platform }));
  }

  async saveMessage(
    sessionId: string,
    role: ChatRole,
    content: string,
    tokensUsed = 0,
  ): Promise<ChatMessage> {
    const msg = this.messages.create({ sessionId, role, content, tokensUsed });
    const saved = await this.messages.save(msg);
    await this.sessions.update(sessionId, { updatedAt: new Date() });
    return saved;
  }

  async getHistory(
    userId: string,
    platform: string,
    limit = DEFAULT_HISTORY_LIMIT,
  ): Promise<ChatMessage[]> {
    const session = await this.sessions.findOne({
      where: { userId, platform },
    });
    if (!session) return [];

    return this.messages.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }
}
