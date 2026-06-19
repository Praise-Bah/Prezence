# Prezence — Claude Code Project Rules

> Claude Code reads this file automatically at the start of every session.
> Follow every rule in this file exactly. Never deviate unless explicitly told to.

---

## What This Project Is

Prezence is an AI-powered personal branding SaaS for Cameroonian youth.
It interviews users via a conversational AI, generates optimised profiles for 8 platforms,
and automatically deploys those updates via a 4-layer integration architecture.

**Owner:** Praise Bucuzong Bah
**Stack:** NestJS 10 (api) + Next.js 14 (web) + React Native Expo (mobile)
**Monorepo:** Turborepo + pnpm workspaces
**Database:** PostgreSQL 15 + pgvector — Supabase project ggjglhekhexsktmihtlo
**Queue:** BullMQ on Upstash Redis
**AI Gateway:** OpenRouter (never call model providers directly)
**Secrets:** Doppler only — never hardcode, never use .env files in production

---

## Non-Negotiable Rules

These are the rules that caused the most bugs in this project.
Violating any of these is a critical error.

### 1. JSON fence stripping — ALWAYS

Every single `JSON.parse()` call on an AI model response must strip markdown
fences before parsing. No exceptions. Even if you think the model won't add fences.

```typescript
// ALWAYS do this
const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
const parsed = JSON.parse(clean);

// NEVER do this
const parsed = JSON.parse(raw);
```

### 2. Auth guard on every endpoint — ALWAYS

Every controller method must have `@UseGuards(JwtAuthGuard)` unless it is
explicitly decorated with `@Public()`. There are no exceptions.

```typescript
// CORRECT
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: UserProfile) { ... }

// CORRECT — explicitly public
@Post('register')
@Public()
async register(@Body() dto: RegisterDto) { ... }

// WRONG — no guard, no @Public()
@Get('profile')
async getProfile(@Body() body: any) { ... }
```

### 3. Always filter by the authenticated user's ID — NEVER trust the request body for userId

The `userId` used in any database query must come from the JWT (`@CurrentUser()` decorator),
never from the request body or query params. A user must never be able to
read or write another user's data by changing a parameter.

```typescript
// CORRECT
@Get('notifications')
@UseGuards(JwtAuthGuard)
async getNotifications(@CurrentUser() user: UserProfile) {
  return this.service.getNotifications(user.id); // from JWT
}

// WRONG — user can pass any userId and read others' data
@Get('notifications')
async getNotifications(@Query('userId') userId: string) {
  return this.service.getNotifications(userId); // from request — NEVER
}
```

### 4. OAuth tokens go through TokenVaultService — NEVER write them directly

Any OAuth access token or refresh token stored in `platform_connections`
must be encrypted via `TokenVaultService` (AES-256-GCM). Never write a
token directly to the database.

```typescript
// CORRECT
const encrypted = await this.tokenVault.encrypt(accessToken, userId);
await supabase.from('platform_connections').upsert({ encrypted_access_token: encrypted });

// WRONG
await supabase.from('platform_connections').upsert({ access_token: accessToken });
```

### 5. Only one system message per OpenRouter call

Never build a `messages` array with two `{ role: 'system' }` entries.
Some LLM providers reject requests with multiple system messages.
Merge all context into a single system message using template literals.

```typescript
// CORRECT
const systemMessage = `You are a professional branding assistant.

User context:
Name: ${user.name}
Platform: ${platform}
Voice preferences: ${JSON.stringify(voicePrefs)}`;

const messages = [
  { role: 'system', content: systemMessage },
  ...conversationHistory
];

// WRONG
const messages = [
  { role: 'system', content: 'You are a professional branding assistant.' },
  { role: 'system', content: `User context: ${JSON.stringify(context)}` }, // second system — NEVER
  ...conversationHistory
];
```

### 6. PLAN_PLATFORM_LIMITS.elite is 999, not Infinity

`Infinity` serialises to `null` in JSON. The config constant is `999`.
Never change it back to `Infinity`.

### 7. Plan prices come from packages/config — never hardcode

```typescript
// CORRECT
import { PLAN_PRICES_XAF } from '@prezence/config';
const price = PLAN_PRICES_XAF.professional; // 6000

// WRONG
const price = 15000; // hardcoded — NEVER
```

### 8. Soft deletes — always filter deleted_at IS NULL

The `users` table uses soft deletes. Any query that reads user records
must include a `deleted_at IS NULL` filter.

```typescript
// CORRECT
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .is('deleted_at', null)
  .single();

// WRONG — returns deleted users too
const { data } = await supabase.from('users').select('*').eq('id', userId).single();
```

### 9. BullMQ jobs must have retry config

Every `queue.add()` call must include `attempts` and `backoff`.

```typescript
// CORRECT
await queue.add('job-name', payload, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: false,
});

// WRONG — no retry config
await queue.add('job-name', payload);
```

### 10. Server Actions use API_URL not NEXT_PUBLIC_API_URL

Server Actions run on the server and call the NestJS API server-to-server.
Use `process.env.API_URL` (internal URL), never `process.env.NEXT_PUBLIC_API_URL`.

```typescript
// CORRECT — in a Server Action
const res = await fetch(`${process.env.API_URL}/auth/me`, { ... });

// WRONG — exposes internal URL to the browser bundle
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { ... });
```

### 11. NEVER use `public.is_admin(...)` in RLS policies

It was dropped in migration 012. Always use `private.is_admin((select auth.uid()))`.

### 12. NEVER import across NestJS module boundaries via internal file paths

Always import through the module's `index.ts` barrel. No direct path imports like
`'../auth/decorators/current-user.decorator'` from outside the auth module.

---

## Architecture You Must Understand

### The 4-layer integration cascade

When a user approves a profile update, the system tries layers in order:

```
L1 (Official API: GitHub, Meta, TikTok)
  → fails → L2 (Make.com webhook: LinkedIn)
    → fails → L3A (Playwright stealth automation: Fiverr, LinkedIn fallback)
      → fails → L3B (Skyvern AI vision: any L3A failure)
        → fails → notify user, mark platform RED in health monitor
```

Layer escalation is automatic. A job that starts at L1 and fails escalates to L2 automatically.
Never skip a layer or hardcode which layer to use.

### The RAG pipeline

Profile generation always goes through this exact sequence:
1. Embed interview answers via `EmbeddingService` (text-embedding-3-small)
2. Retrieve top-3 platform knowledge docs + top-2 user profile history from pgvector
3. Fetch live market signals from `MarketSignalService` (cached 24h in Redis)
4. Load the active prompt from `PromptRegistryService`
5. Call `ModelRouterService` → claude-sonnet-4.6 → get structured JSON response
6. Strip JSON fences → parse → validate against output_schema
7. Pass through `QualityGateService` (Gemini Flash) → max 2 regeneration attempts
8. Store in `profile_data` + embed and store in `ai_embeddings`
9. Enqueue MFS computation job

Never skip steps 2, 6, or 7.

### Authentication flow

```
POST /auth/login
  → rate limit check (Redis sliding window: 5 req/15min for auth)
  → account lockout check (Redis: 5 failures → 15min lock)
  → bcrypt compare (cost 12)
  → issue access token (15min JWT → httpOnly cookie prezence_at)
  → issue refresh token (7-day JWT with family_id → httpOnly cookie prezence_rt)
  → store refresh token in auth_refresh_tokens table

POST /auth/refresh
  → validate refresh token signature and expiry
  → look up token in auth_refresh_tokens
  → if not found: token was already used or revoked → revoke entire family → return 401
  → if found: delete old token, issue new access + refresh pair
  → this is token rotation with reuse detection
```

### Payment flow

```
User uploads screenshot
  → stored in Cloudflare R2
  → Claude vision analyses it (claude-sonnet-4.6 via OpenRouter)
  → response fences stripped → JSON.parse()
  → confidence: HIGH(80-100) / MEDIUM(60-79) / LOW(40-59) / SUSPICIOUS(0-39)
  → HIGH: 24h provisional access, flag for admin
  → MEDIUM: 24h provisional access, priority flag for admin
  → LOW: hold, ask user to resubmit
  → SUSPICIOUS: reject, notify admin
  → Admin confirms → subscription activated → user notified
```

---

## Module Structure

```
apps/api/src/
  auth/           AuthModule    — JWT, bcrypt, refresh token rotation, rate limiting
  billing/        BillingModule — screenshot payment, Resend admin alerts
  intelligence/   IntelligenceModule — RAG, profile generation, MFS, voice learning
  content/        ContentModule — profile CRUD, regeneration
  integration/    IntegrationModule — OAuth, token vault, L1/L3A publishers
  notification/   NotificationModule — email worker (Resend), in-app notifications
  platform-health/ PlatformHealthModule — health checks per platform per user
  ai/             AIModule      — chat assistant, prompt registry, usage logging
```

---

## Database Tables (all have RLS enabled)

| Table | Owner | Key constraint |
|---|---|---|
| users | system | soft delete via deleted_at |
| auth_refresh_tokens | system | family_id for reuse detection |
| subscription_requests | users | UNIQUE(transaction_id_extracted) |
| platform_connections | users | encrypted_access_token always via TokenVaultService |
| profile_data | users | one row per user per platform |
| automation_jobs | users | proof_url stored in R2 |
| market_scores | users | UNIQUE(user_id, platform) — always upsert |
| ai_embeddings | users | vector(1536) with HNSW index |
| prompt_registry | system | active=true gates which version is live |
| audit_logs | system | append-only — no UPDATE or DELETE RLS |
| payment_events | system | UNIQUE(provider_event_id) for idempotency |
| notifications | users | user can SELECT and UPDATE(is_read) only |
| password_reset_tokens | system | store token_hash only — never raw token |
| chat_sessions | users | one session per user per platform |
| chat_messages | users | append-only, scoped to session |

---

## Shared Package Exports — Always Use These

**packages/config** — import everything from here, never hardcode:
- `AI_MODELS` — model strings for each task type
- `PLAN_PRICES_XAF` — { starter: 3000, professional: 6000, elite: 12000 }
- `PLAN_PLATFORM_LIMITS` — { free: 2, starter: 2, professional: 5, elite: 999 }
- `PLATFORM_CHAR_LIMITS` — character limits per field per platform
- `QUEUE_NAMES` — all BullMQ queue name strings
- `CACHE_TTL` — all Redis TTL values in seconds

**packages/types** — import everything from here, never redefine:
- `UserRole`, `SubscriptionPlan`, `PaymentMethod`, `ScreeningConfidence`
- `SupportedPlatform`, `IntegrationLayer`, `AutomationJob`
- `GeneratedProfile`, `MarketFitScore`, `InterviewAnswers`
- `ContentGenerationJobData`, `QaResult`, `UserProfile`

---

## NestJS Module Boundaries — STRICT

AuthModule, AIModule, IntelligenceModule, IntegrationModule,
BillingModule, ContentModule, PlatformHealthModule, NotificationModule.
Never import across module boundaries without going through the module's
exported service and its `index.ts` barrel. No circular imports.

---

## Before Every Commit

- Always run `pnpm lint && pnpm typecheck` from the root
- Always run `pnpm test --filter=api` — all tests must pass
- Always run `gh run list --branch develop --limit 1` and wait for green after every push
- Never declare a task done until CI is confirmed green

## Commands

- Dev (all): `pnpm dev`
- Dev (api only): `pnpm dev --filter=api`
- Dev (web only): `pnpm dev --filter=web`
- Test: `pnpm test --filter=api`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`

---

## Things That Have Caused Bugs Before (Do Not Repeat)

1. `promptTokens: 0` hardcoded in ChatService — always use real values from OpenRouter response
2. Two `{ role: 'system' }` messages in the same request — merge into one
3. `PLAN_PLATFORM_LIMITS.elite = Infinity` — use 999
4. Frontend plan prices hardcoded as 15000/35000 XAF — use `PLAN_PRICES_XAF` from config
5. "Get Free Plan" button text — must be "Get Started — Free"
6. MTN MoMo SMS format too vague in screening prompt — use exact field extraction templates
7. ±200 XAF tolerance hint contradicting amount matching rules — removed, do not re-add
8. `public.is_admin(...)` in RLS — always use `private.is_admin((select auth.uid()))`
9. Reset URL `/auth/reset-password` — correct path is `/reset-password`
10. Notifications insert RLS with no `to` clause — always scope insert to `service_role`
11. Non-atomic token consumption in resetPassword — use UPDATE WHERE used_at IS NULL, check affected

## What We Are Building Right Now

See TASKS.md for current sprint status.
