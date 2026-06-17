import { Controller, Get, Post, Request } from '@nestjs/common';
import { PlatformHealthService } from './platform-health.service';

@Controller('platform-health')
export class PlatformHealthController {
  constructor(private readonly healthService: PlatformHealthService) {}

  @Get()
  getLatest(@Request() req: { user: { userId: string } }) {
    return this.healthService.getLatest(req.user.userId);
  }

  @Post('check')
  runCheck(@Request() req: { user: { userId: string } }) {
    return this.healthService.checkAll(req.user.userId);
  }
}
