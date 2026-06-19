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
  linkedin:   { headline: 220, summary: 2000, experience_description: 2000 },
  github:     { bio: 160, readme: 100000 },
  instagram:  { bio: 150 },
  facebook:   { about: 255 },
  fiverr:     { tagline: 70, description: 4000 },
  freelancer: { tagline: 100, description: 5000 },
  tiktok:     { bio: 80 },
  twitter:    { bio: 160 },
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
  screenshot_screening: 'screenshot-screening',  // MVP payment processing
  webhook_retry: 'webhook-retry',
} as const;

// ─── Plan prices ─────────────────────────────────────────────────────────────
// starter: one-time payment (access until manually cancelled)
// professional / elite: monthly recurring, screenshot re-verified each month

export const PLAN_PRICES_XAF = {
  starter:      3_000,
  professional: 6_000,
  elite:        12_000,
} as const;

export const PLAN_PRICES_USD = {
  starter:      5,
  professional: 10,
  elite:        20,
} as const;

// ─── Per-plan platform connection limits ──────────────────────────────────────

export const PLAN_PLATFORM_LIMITS = {
  free:         2,
  starter:      2,   // same as free but with better AI
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
