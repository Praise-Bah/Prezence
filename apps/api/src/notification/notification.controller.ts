import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface';
import type { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

function toDto(n: Notification): NotificationDto {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    action_url: n.actionUrl,
    is_read: n.isRead,
    created_at: n.createdAt.toISOString(),
  };
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationDto[]> {
    const notifications = await this.notificationService.listForUser(
      user.userId,
    );
    return notifications.map(toDto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ updated: boolean }> {
    const result = await this.notificationService.markRead(id, user.userId);
    if (!result.updated) {
      throw new NotFoundException('Notification not found or already read.');
    }
    return result;
  }
}
