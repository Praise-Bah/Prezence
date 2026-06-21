import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';

// L3A: Playwright automation for Upwork profile updates.
// The automation logs in with stored credentials and updates the profile overview,
// title, and skills via the Upwork profile editor.
@Injectable()
export class UpworkStrategy extends BasePublisherStrategy {
  publish(
    _accessToken: string,
    content: Record<string, string>,
    _platform: SupportedPlatform,
    _userId: string,
  ): Promise<string | null> {
    const title = content['title'] ?? '';
    const overview = content['overview'] ?? content['bio'] ?? '';

    if (!title && !overview) {
      throw new ServiceUnavailableException(
        'Upwork strategy: content must contain at least title or overview.',
      );
    }

    // Phase 2 implementation: Playwright automation goes here.
    // Awaiting UX test results from the QA team before wiring Playwright.
    throw new ServiceUnavailableException(
      'Upwork L3A automation is not yet deployed. Please update your profile manually.',
    );
  }
}
