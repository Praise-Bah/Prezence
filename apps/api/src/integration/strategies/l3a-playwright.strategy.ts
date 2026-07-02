import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';
import { BehanceStrategy } from './behance.strategy';
import { DevtoStrategy } from './devto.strategy';
import { DribbbleStrategy } from './dribbble.strategy';
import { FiverrStrategy } from './fiverr.strategy';
import { HashnodeStrategy } from './hashnode.strategy';
import { MediumStrategy } from './medium.strategy';
import { UpworkStrategy } from './upwork.strategy';

// Browser-automation router for L3A platforms (no accessible APIs).
// Phase 1: Fiverr — fully implemented.
// Phase 2: Upwork, Medium, DEV.to, Hashnode, Behance, Dribbble — scaffolded, Playwright pending.
// All other platforms escalate to L3B (Skyvern).
@Injectable()
export class L3aPlaywrightStrategy extends BasePublisherStrategy {
  constructor(
    private readonly fiverrStrategy: FiverrStrategy,
    private readonly upworkStrategy: UpworkStrategy,
    private readonly mediumStrategy: MediumStrategy,
    private readonly devtoStrategy: DevtoStrategy,
    private readonly hashnodeStrategy: HashnodeStrategy,
    private readonly behanceStrategy: BehanceStrategy,
    private readonly dribbbleStrategy: DribbbleStrategy,
  ) {
    super();
  }

  publish(
    accessToken: string,
    content: Record<string, string>,
    platform: SupportedPlatform,
    userId: string,
  ): Promise<string | null> {
    switch (platform) {
      case 'fiverr':
        return this.fiverrStrategy.publish(
          accessToken,
          content,
          platform,
          userId,
        );
      case 'upwork':
        return this.upworkStrategy.publish(
          accessToken,
          content,
          platform,
          userId,
        );
      case 'medium':
        return this.mediumStrategy.publish(
          accessToken,
          content,
          platform,
          userId,
        );
      case 'devto':
        return this.devtoStrategy.publish(
          accessToken,
          content,
          platform,
          userId,
        );
      case 'hashnode':
        return this.hashnodeStrategy.publish(
          accessToken,
          content,
          platform,
          userId,
        );
      case 'behance':
        return this.behanceStrategy.publish(
          accessToken,
          content,
          platform,
          userId,
        );
      case 'dribbble':
        return this.dribbbleStrategy.publish(
          accessToken,
          content,
          platform,
          userId,
        );
      default:
        throw new ServiceUnavailableException(
          `L3A browser automation for ${platform} is not yet available. ` +
            'Check back after the Phase 3 release.',
        );
    }
  }
}
