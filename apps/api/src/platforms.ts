import type { SupportedPlatform } from '@prezence/types';

export type PlatformPhase = 'phase1' | 'phase2' | 'phase3';

export interface PlatformInfo {
  platform: SupportedPlatform;
  phase: PlatformPhase;
  layer: 'L1' | 'L3A' | 'L3B';
}

export const SUPPORTED_PLATFORM_ENUM = {
  // Phase 1 — Fully implemented
  linkedin: 'linkedin',
  github: 'github',
  instagram: 'instagram',
  facebook: 'facebook',
  fiverr: 'fiverr',
  freelancer: 'freelancer',
  tiktok: 'tiktok',
  twitter: 'twitter',
  // Phase 2 — L3A Playwright automation
  upwork: 'upwork',
  youtube: 'youtube',
  medium: 'medium',
  devto: 'devto',
  hashnode: 'hashnode',
  // Phase 3 — L3B Skyvern automation
  stackoverflow: 'stackoverflow',
  behance: 'behance',
  dribbble: 'dribbble',
  pinterest: 'pinterest',
  snapchat: 'snapchat',
  twitch: 'twitch',
  substack: 'substack',
  whatsapp_business: 'whatsapp_business',
  reddit: 'reddit',
} as const satisfies Record<SupportedPlatform, SupportedPlatform>;

export const ALL_PLATFORMS: PlatformInfo[] = [
  // Phase 1 — L1 official APIs or well-tested L3A
  { platform: 'linkedin', phase: 'phase1', layer: 'L1' },
  { platform: 'github', phase: 'phase1', layer: 'L1' },
  { platform: 'instagram', phase: 'phase1', layer: 'L1' },
  { platform: 'facebook', phase: 'phase1', layer: 'L1' },
  { platform: 'fiverr', phase: 'phase1', layer: 'L3A' },
  { platform: 'freelancer', phase: 'phase1', layer: 'L3A' },
  { platform: 'tiktok', phase: 'phase1', layer: 'L1' },
  { platform: 'twitter', phase: 'phase1', layer: 'L1' },
  // Phase 2 — L3A Playwright automation
  { platform: 'upwork', phase: 'phase2', layer: 'L3A' },
  { platform: 'youtube', phase: 'phase2', layer: 'L3A' },
  { platform: 'medium', phase: 'phase2', layer: 'L3A' },
  { platform: 'devto', phase: 'phase2', layer: 'L3A' },
  { platform: 'hashnode', phase: 'phase2', layer: 'L3A' },
  // Phase 3 — L3B Skyvern AI vision automation
  { platform: 'stackoverflow', phase: 'phase3', layer: 'L3B' },
  { platform: 'behance', phase: 'phase3', layer: 'L3B' },
  { platform: 'dribbble', phase: 'phase3', layer: 'L3B' },
  { platform: 'pinterest', phase: 'phase3', layer: 'L3B' },
  { platform: 'snapchat', phase: 'phase3', layer: 'L3B' },
  { platform: 'twitch', phase: 'phase3', layer: 'L3B' },
  { platform: 'substack', phase: 'phase3', layer: 'L3B' },
  { platform: 'whatsapp_business', phase: 'phase3', layer: 'L3B' },
  { platform: 'reddit', phase: 'phase3', layer: 'L3B' },
];
