import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';

// Playwright-based browser automation for platforms without accessible APIs.
// Requires SMARTPROXY_HOST/USERNAME/PASSWORD env vars and the playwright package.
// Stub implementation — concrete platform scripts are Phase 2.
@Injectable()
export class L3aPlaywrightStrategy extends BasePublisherStrategy {
  publish(
    _accessToken: string,
    _content: Record<string, string>,
    platform: SupportedPlatform,
  ): Promise<string | null> {
    throw new ServiceUnavailableException(
      `L3A browser automation for ${platform} is not yet available. ` +
        'Connect via GitHub (L1) or check back after the Phase 2 release.',
    );
  }
}
