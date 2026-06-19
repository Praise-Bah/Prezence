import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { Server, Socket } from 'socket.io';
import { REDIS_CLIENT } from '../redis';

export interface JobUpdatePayload {
  jobId: string;
  type: 'content_generation' | 'automation' | 'mfs_compute';
  platform: string;
  status: 'running' | 'completed' | 'failed';
  errorMessage?: string;
}

@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async handleConnection(client: Socket): Promise<void> {
    const ticket = client.handshake.auth['ticket'] as string | undefined;

    if (!ticket) {
      this.logger.warn(`WS rejected: no ticket (socket ${client.id})`);
      client.disconnect(true);
      return;
    }

    const userId = await this.redis.get(`ws:ticket:${ticket}`);
    if (!userId) {
      this.logger.warn(
        `WS rejected: invalid/expired ticket (socket ${client.id})`,
      );
      client.disconnect(true);
      return;
    }

    await this.redis.del(`ws:ticket:${ticket}`);
    await client.join(`user:${userId}`);
    this.logger.debug(`WS connected: user ${userId} (socket ${client.id})`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`WS disconnected: socket ${client.id}`);
  }

  emitJobUpdate(userId: string, payload: JobUpdatePayload): void {
    this.server.to(`user:${userId}`).emit('job:update', payload);
  }
}
