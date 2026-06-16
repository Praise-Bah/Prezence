import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { AdminBillingService } from './admin-billing.service';
import { ReviewSubmissionDto } from './dto/review-submission.dto';

@Controller('billing/admin')
@Roles('system_admin', 'support')
export class AdminBillingController {
  constructor(private readonly adminBillingService: AdminBillingService) {}

  @Get('queue')
  listPending() {
    return this.adminBillingService.listPending();
  }

  @Post(':id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() reviewer: AuthenticatedUser,
    @Body() dto: ReviewSubmissionDto,
  ) {
    return this.adminBillingService.review(id, reviewer.userId, dto);
  }
}
