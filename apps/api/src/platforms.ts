import type { SupportedPlatform } from '@prezence/types';

export const SUPPORTED_PLATFORM_ENUM = {
  linkedin: 'linkedin',
  github: 'github',
  instagram: 'instagram',
  facebook: 'facebook',
  fiverr: 'fiverr',
  freelancer: 'freelancer',
  tiktok: 'tiktok',
  twitter: 'twitter',
} as const satisfies Record<SupportedPlatform, SupportedPlatform>;
