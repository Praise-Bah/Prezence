import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';

// L3A: Playwright automation for Hashnode profile updates.
// Updates bio, tagline, and social links via the Hashnode profile settings page.
@Injectable()
export class HashnodeStrategy extends BasePublisherStrategy {
  publish(
    _accessToken: string,
    content: Record<string, string>,
    _platform: SupportedPlatform,
    _userId: string,
  ): Promise<string | null> {
    const bio = content['bio'] ?? '';

    if (!bio) {
      throw new ServiceUnavailableException(
        'Hashnode strategy: content must contain bio.',
      );
    }

    // Phase 2 implementation: Playwright automation goes here.
    throw new ServiceUnavailableException(
      'Hashnode L3A automation is not yet deployed. Please update your profile manually.',
    );
  }
}
