import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';
import { FiverrStrategy } from './fiverr.strategy';

// Browser-automation router for L3A platforms (no accessible APIs).
// Fiverr is fully implemented; all other L3A platforms are Phase 3.
@Injectable()
export class L3aPlaywrightStrategy extends BasePublisherStrategy {
  constructor(private readonly fiverrStrategy: FiverrStrategy) {
    super();
  }

  publish(
    accessToken: string,
    content: Record<string, string>,
    platform: SupportedPlatform,
  ): Promise<string | null> {
    if (platform === 'fiverr') {
      return this.fiverrStrategy.publish(accessToken, content, platform);
    }

    throw new ServiceUnavailableException(
      `L3A browser automation for ${platform} is not yet available. ` +
        'Check back after the Phase 3 release.',
    );
  }
}
