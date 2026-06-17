import type { SupportedPlatform } from '@prezence/types';

export abstract class BasePublisherStrategy {
  // Returns proof_url (e.g. screenshot in R2) or null for API-based publishers.
  abstract publish(
    accessToken: string,
    content: Record<string, string>,
    platform: SupportedPlatform,
  ): Promise<string | null>;
}
