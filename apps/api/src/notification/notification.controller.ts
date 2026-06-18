import { Controller, Get } from '@nestjs/common';

// Notification persistence is not yet implemented.
// This endpoint returns an empty array so the frontend renders an empty state
// rather than a 404 error. Full implementation (TypeORM entity, read/mark-read
// endpoints) will be added in the notifications feature sprint.
export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

@Controller('notifications')
export class NotificationController {
  @Get()
  list(): NotificationDto[] {
    return [];
  }
}
