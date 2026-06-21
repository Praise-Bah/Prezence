// ─── AI models ────────────────────────────────────────────────────────────────

export const AI_MODELS = {
  generation: 'anthropic/claude-sonnet-4-6',
  qa:         'google/gemini-flash-1.5-8b',
  scoring:    'google/gemini-flash-1.5-8b',
  embedding:  'openai/text-embedding-ada-002',
} as const;

export const INTERVIEW_VERSION = 1;

// ─── Platform character limits ────────────────────────────────────────────────

export const PLATFORM_CHAR_LIMITS = {
  // Phase 1
  linkedin:           { headline: 220, summary: 2000, experience_description: 2000 },
  github:             { bio: 160, readme: 100000 },
  instagram:          { bio: 150 },
  facebook:           { about: 255 },
  fiverr:             { tagline: 70, description: 4000 },
  freelancer:         { tagline: 100, description: 5000 },
  tiktok:             { bio: 80 },
  twitter:            { bio: 160 },
  // Phase 2
  upwork:             { title: 100, overview: 5000, tagline: 200 },
  youtube:            { description: 1000, channel_description: 5000 },
  medium:             { bio: 160 },
  devto:              { bio: 200, tagline: 200 },
  hashnode:           { bio: 200, tagline: 200 },
  // Phase 3
  stackoverflow:      { about_me: 3000 },
  behance:            { bio: 500, headline: 180 },
  dribbble:           { bio: 200 },
  pinterest:          { bio: 160 },
  snapchat:           { bio: 150 },
  twitch:             { bio: 300, panels: 5000 },
  substack:           { bio: 200, tagline: 200 },
  whatsapp_business:  { about: 139, description: 512 },
  reddit:             { bio: 200 },
} as const;

// ─── Cache TTLs (seconds) ──────────────────────────────────────────────────────

export const CACHE_TTL = {
  market_signals: 60 * 60 * 24,          // 24 hours
  generated_profile: 60 * 60 * 24 * 7,   // 7 days (versioned key)
  platform_health: 60 * 10,              // 10 minutes
  user_preferences: 60 * 60,             // 1 hour
  session: 60 * 30,                      // 30 minutes sliding
  oauth_token_valid: 60 * 15,            // 15 minutes
  screenshot_dedup: 60 * 60 * 24 * 30,   // 30 days (transaction ID uniqueness)
} as const;

// ─── Queue names ─────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  automation: 'automation-jobs',
  content_generation: 'content-generation',
  mfs_compute: 'mfs-compute',
  email: 'email-notifications',
  screenshot_screening: 'screenshot-screening',
  webhook_retry: 'webhook-retry',
  content_schedule: 'content-schedule',
  l3b_jobs: 'l3b-jobs',
  document_extraction: 'document-extraction',
} as const;

// ─── Plan prices ─────────────────────────────────────────────────────────────
// free: one-time 3,000 XAF payment grants lifetime access to the free tier
// professional / elite: monthly recurring, screenshot re-verified each month

export const PLAN_PRICES_XAF = {
  free:         3_000,
  professional: 6_000,
  elite:        12_000,
} as const;

export const PLAN_PRICES_USD = {
  free:         5,
  professional: 10,
  elite:        20,
} as const;

// ─── Per-plan platform connection limits ──────────────────────────────────────

export const PLAN_PLATFORM_LIMITS = {
  free:         2,
  professional: 5,
  elite:        999, // effectively unlimited; avoids Infinity which serialises to null in JSON
} as const;

// ─── Screenshot screening thresholds ───────────────────────────────────────────

export const SCREENING = {
  confidence: {
    HIGH:       80,   // → provisional access granted
    MEDIUM:     60,   // → provisional access + priority review
    LOW:        40,   // → hold, ask user to resubmit
    SUSPICIOUS: 0,    // → reject, flag for investigation
  },
  max_uploads_per_day: 3,
  provisional_access_hours: 24,
  grace_period_days: 7,  // past_due users keep access for 7 days
} as const;

// ─── Payment routing (Phase 2+) ─────────────────────────────────────────────────

export const PAYSTACK_COUNTRIES = ['NG', 'GH', 'ZA'] as const;

export const PLATFORMS_BY_PHASE = {
  phase1: ['linkedin', 'instagram', 'facebook', 'fiverr', 'freelancer', 'github'],
  phase2: ['tiktok'],
  phase3: ['twitter'],
} as const;

// ─── Platform registry ────────────────────────────────────────────────────────

export const SUPPORTED_PLATFORMS = {
  github:            { id: 'github',            layer: 'L1',  phase: 1 },
  facebook:          { id: 'facebook',          layer: 'L1',  phase: 1 },
  instagram:         { id: 'instagram',         layer: 'L1',  phase: 1 },
  tiktok:            { id: 'tiktok',            layer: 'L1',  phase: 1 },
  freelancer:        { id: 'freelancer',        layer: 'L1',  phase: 1 },
  linkedin:          { id: 'linkedin',          layer: 'L2',  phase: 1 },
  fiverr:            { id: 'fiverr',            layer: 'L3A', phase: 1 },
  twitter:           { id: 'twitter',           layer: 'L2',  phase: 2 },
  pinterest:         { id: 'pinterest',         layer: 'L2',  phase: 2 },
  upwork:            { id: 'upwork',            layer: 'L3A', phase: 2 },
  behance:           { id: 'behance',           layer: 'L3A', phase: 2 },
  dribbble:          { id: 'dribbble',          layer: 'L3A', phase: 2 },
  medium:            { id: 'medium',            layer: 'L3A', phase: 2 },
  devto:             { id: 'devto',             layer: 'L3A', phase: 2 },
  hashnode:          { id: 'hashnode',          layer: 'L3A', phase: 2 },
  youtube:           { id: 'youtube',           layer: 'L3B', phase: 2 },
  stackoverflow:     { id: 'stackoverflow',     layer: 'L3A', phase: 3 },
  kaggle:            { id: 'kaggle',            layer: 'L3A', phase: 3 },
  snapchat:          { id: 'snapchat',          layer: 'L3B', phase: 3 },
  whatsapp_business: { id: 'whatsapp_business', layer: 'L3B', phase: 3 },
} as const;

export const PLATFORM_DESCRIPTIONS: Record<string, string> = {
  github:            'Updates your profile README, bio, and pinned repos',
  linkedin:          'Keeps headline, about section, and skills current',
  instagram:         'Maintains bio, link in bio, and profile keywords',
  facebook:          'Updates headline, about section, and skills',
  tiktok:            'Optimises bio and profile description',
  fiverr:            'Improves gig titles, descriptions, and search tags',
  upwork:            'Sharpens title, overview, and skills for more contracts',
  twitter:           'Keeps bio and pinned tweet content fresh',
  freelancer:        'Optimises tagline and overview for project visibility',
  behance:           'Updates tagline and about for creative discovery',
  dribbble:          'Maintains bio and tagline for design clients',
  medium:            'Keeps author bio aligned with your brand voice',
  devto:             'Optimises bio and tagline for developer audience',
  hashnode:          'Updates tagline and bio for tech blogging reach',
  stackoverflow:     'Improves about me for recruiter visibility',
  kaggle:            'Updates bio for data science community reach',
  youtube:           'Keeps channel description and about section current',
  pinterest:         'Optimises bio and board descriptions for discovery',
  snapchat:          'Updates public profile bio and story description',
  whatsapp_business: 'Keeps business profile description and catalogue current',
};
