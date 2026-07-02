import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';

// L3A: Playwright automation for Behance profile updates.
// Updates bio and creative fields via the Behance profile settings page.
@Injectable()
export class BehanceStrategy extends BasePublisherStrategy {
  publish(
    _accessToken: string,
    content: Record<string, string>,
    _platform: SupportedPlatform,
    _userId: string,
  ): Promise<string | null> {
    const bio = content['bio'] ?? '';

    if (!bio) {
      throw new ServiceUnavailableException(
        'Behance strategy: content must contain bio.',
      );
    }

    // Phase 2 implementation: Playwright automation goes here.
    throw new ServiceUnavailableException(
      'Behance L3A automation is not yet deployed. Please update your profile manually.',
    );
  }
}
