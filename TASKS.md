# Prezence — Build Progress

## ✅ Done
- GitHub repo created (github.com/Praise-Bah/Prezence, private)
- Branch protection ruleset on main (PR required, squash merge, block force push, lint-and-test required)
- CLAUDE.md created
- TASKS.md created
- Monorepo scaffold (Turborepo + pnpm workspaces)
- CI green on develop (lint-and-test passing)
- Claude Code skills created (prezence-patterns, nestjs-module, billing-patterns, security-patterns, nestjs-expert)
- MCP servers configured (.mcp.json: supabase-read, supabase-write, github — locally-installed stdio servers using Doppler tokens; sentry, playwright, context7 — npx-based)
- Figma plugin installed and Figma/GitHub/Supabase/Sentry/Google Drive connected as claude.ai OAuth connectors
- Cursor rules created (.cursor/rules/: base, nestjs-api, nextjs-web, debugging, security)
- Supabase project linked (ref ggjglhekhexsktmihtlo) + pgvector extension enabled (v0.8.0)
- Doppler project "prezence" / config "dev" populated with all dev secrets
- .env.example created at monorepo root
- supabase/ folder structure created (migrations/, seed/)
- App dev scripts wrapped with `doppler run --` (apps/api, apps/web), with `:ci` fallbacks
- Upstash Redis connected and tested
- OpenRouter API key added and screenshot AI capability verified
- Founder MoMo/Orange Money numbers added to Doppler
- shared packages/types created; shared packages/config created
- Workspace package links wired into api and web apps
- Branch automation workflows created (develop→staging auto-PR, staging→main auto-PR)
- GitHub labels created; staging branch protection added
- Phase 0 database foundation (PR #4): 20 Supabase migrations covering users,
  subscription_requests, platform_connections, profile_data, automation_jobs,
  market_scores, ai_embeddings/prompt_registry, audit_logs, payment_events,
  billing, ai_usage_logs, platform_health_checks — all RLS-enabled, clean advisors
- AuthModule (PR #5): custom JWT auth, access/refresh token rotation + reuse-detection,
  Redis lockout + rate limiting, global guards; 28 unit tests; CI green
- BillingModule (PR #7): MTN MoMo / Orange Money screenshot flow, BullMQ AI screening,
  OpenRouter vision, auto-approve / provisional / reject, admin review endpoints;
  6 unit tests; CI green
- IntelligenceModule (PR #10): RAG pipeline — interview → pgvector embeddings →
  Claude Sonnet generation → Gemini Flash QA → profile_data + market_scores;
  41 unit tests; CI green
- ContentModule: platform-specific content delivery, re-generation via BullMQ; CI green
- IntegrationModule (PR #28): AES-256-GCM token vault, L1 GitHub publisher, L3A Playwright
  stub, BullMQ automation jobs; CI green
- NotificationModule: email queue service + BullMQ processor, email templates; CI green
- PlatformHealthModule (PR #31): token validity checks, Redis 10-min cache,
  DISTINCT ON latest-per-platform query; CI green
- All barrel import violations fixed across all modules (PR #33); CI green
- AIModule (PR #36 + Greptile fixes PRs #43 #46 #49 → merged to main PR #52–#54):
  OpenRouter model routing abstraction (ModelRouterService), prompt versioning
  (PromptRegistryService), AI usage logging (AiUsageService with full token breakdown),
  ChatService (POST /ai/chat with merged single-system-message pattern),
  real MTN MoMo + Orange Money SMS recognition patterns in screenshot screener,
  amount tolerance +500 XAF for transfer fees, PLAN_PLATFORM_LIMITS with 999 sentinel,
  plan prices corrected (XAF 3,000 one-time / 6,000/mo / 12,000/mo); CI green, merged to main
- Phase 2 feature completions (PR #55, merged to develop → main):
  - Email BullMQ worker (Resend transport, templates for all event types)
  - PATCH /auth/me (name, bio, location, timezone, notification prefs)
  - POST /auth/change-password, POST /auth/forgot-password, POST /auth/reset-password
  - Notification persistence: TypeORM entity, migration, GET/PATCH endpoints
  - Platform OAuth redirect flow (Meta/LinkedIn callback + encrypted token store)
  - Market-Fit Score BullMQ processor (AI scoring via Gemini Flash)
  - WebSocket gateway + ticket-based auth + frontend job-status hook
  - ChatService + PromptRegistry unit tests (16 tests); auth E2E journey (9 assertions)
  - Loading skeletons + shared error boundary for all (app) routes
  - Voice-learning nightly cron (EmbeddingCronService, @Cron 02:00 UTC)
  - Font swap: Inter (body) + Poppins (headings) via next/font
  - Fiverr L3A Playwright strategy with real CSS selectors
  - SQL migrations: user profile columns, password_reset_tokens table
  - Security fix: stale reset tokens invalidated before new one issued
- Web frontend — all 9 Figma phases implemented (Cursor + Figma MCP):
  - Phase 1: 32 Figma assets exported to apps/web/public/assets/
  - Phase 2: Landing page (apps/web/app/page.tsx)
  - Phase 3: Auth screens — login + register with split-panel layout, Figma tokens
  - Phase 4: Dashboard shell — sidebar (280px, 9 nav links, upgrade card), topbar (71px)
  - Phase 5: Interview 3-step wizard + ContentViewer with per-field copy/regenerate
  - Phase 6: Billing + PaymentModal 4-step flow (MTN/Orange Money assets)
  - Phase 7: Profile form + Settings form (UI built, save "coming soon")
  - Phase 8: Platforms health dashboard, Notifications panel, Documents stub
  - Phase 9: AI chat (welcome state + chat bubbles + typing indicator), Server Action for /ai/chat
  - Shared UI: variant="auth"/"content"/"google" on Input/Button; Toggle, Tabs components
  - GET /notifications stub returning [] wired to notification page
  - UserProfile.name? added to packages/types

## 🔄 In Progress
- Nothing — all web items complete; ready to commit + PR

## ✅ Phase 3 complete (feature/ai-module)
1. **AI chat history** — chat_sessions + chat_messages tables, GET /ai/chat/history,
   frontend chat loads + appends history.
2. **Platform OAuth connect/disconnect UI** — connect flow + disconnect button wired in
   apps/web/app/(app)/platforms/; calls POST /integration/connect and DELETE /integration/:platform.
3. **GET /platform-health/:platform** — single-platform health route added.
4. **Settings save wiring** — notification preferences + timezone PATCH wired in settings-form.tsx.
5. **Platform publish strategies** — LinkedIn (L2 ugcPosts) and Meta/Instagram (Graph API v19)
   strategies added; AutomationProcessor routes by platform.
6. **Admin screens** — /admin/billing queue with approve/reject modal; sidebar Admin link
   visible to system_admin and support roles.
7. **Content scheduler** — POST/GET/DELETE /content/schedule; BullMQ delayed job;
   plan gate (professional/elite only); Schedule button + modal + scheduled posts list
   in ContentViewer; JWT payload now carries `plan` field.

✅ **AI usage dashboard** — GET /ai/usage (user) + GET /ai/usage/admin (system_admin/support);
   /usage page with stat cards, by-model table, by-feature table; admin sees system-wide
   view + top-10 users table; Usage link added to sidebar secondary nav.

✅ **Watch demo modal** — WatchDemoButton client component with YouTube embed modal;
   wired into landing hero, hero remains a server component.

✅ **Webhook retry queue** — WebhookRetryProcessor consumes QUEUE_NAMES.webhook_retry;
   AutomationProcessor now escalates L1 failures to L2 Make.com webhook when
   MAKE_WEBHOOK_URL_{PLATFORM} env var is set; @OnWorkerEvent('failed') marks
   automation job failed and notifies user after all retries exhausted.
   WebhookRetryJobData added to @prezence/types.

✅ **Social OAuth** — Google/Facebook Passport strategies; code-exchange flow avoids
   cross-domain cookie issues; `/auth/social/callback` server page issues httpOnly cookies;
   `?error=oauth_failed` banner on login page; `.env.example` updated with
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`.
   **Action required:** add real values to Doppler before OAuth flows will work.
   Apple Sign-In deferred (requires paid Apple Developer membership).

## 📋 Up Next (priority order)

1. **Doppler secrets** — add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FRONTEND_URL` (prod URL) to Doppler.
2. **Demo video** — update `DEMO_VIDEO_ID` in `apps/web/components/landing/demo-modal.tsx`
   from placeholder `dQw4w9WgXcQ` to the real Prezence YouTube video ID.
3. **Mobile app** (apps/mobile) — deferred; web-first complete.

## 🚧 Blockers / Open Decisions
- supabase-read/write and github MCP servers point to packages installed locally at
  `~/.mcp-servers/{supabase,github}` (npx hits a Node 22 ESM resolution bug for
  `@supabase/mcp-server-supabase` on Windows). Each developer must run, once:
  ```
  mkdir -p ~/.mcp-servers/supabase && cd ~/.mcp-servers/supabase && npm install @supabase/mcp-server-supabase zod
  mkdir -p ~/.mcp-servers/github && cd ~/.mcp-servers/github && npm install @modelcontextprotocol/server-github
  ```
  and update absolute paths in `.mcp.json` to match their own home directory.
- On Windows + git-bash, `doppler run` sometimes fails with "you must provide a token"
  due to path-scope matching; fix by passing `--scope 'C:\Users\<you>\Downloads\Prezence'`.
- sentry/playwright/context7 MCP servers intermittently show "Failed to connect" during
  `claude mcp list` health checks — npx cold-start latency, not a config issue.
- `SENTRY_DSN_API` was overwritten with a placeholder value; Doppler retains version
  history if it needs restoring.
- OpenRouter returns markdown-fenced JSON even with `response_format: json_object` —
  production screenshot-screening code strips code fences before JSON.parse (already fixed).
- No Flutterwave keys in dev — placeholder values only until business account approved.

## 📐 Locked Architectural Decisions
- AES-256-GCM envelope encryption for all OAuth platform tokens (not our own JWTs)
- Our own JWTs stored exclusively in httpOnly cookies (prezence_at 15min, prezence_rt 7d)
- Composio rejected — all L1 integrations built directly in NestJS
- pgvector in PostgreSQL — no separate vector DB
- OpenRouter for all AI model routing; NEVER call OpenRouter outside AIModule/IntelligenceModule
- Modular monolith — no microservices until Phase 3
- Docker Compose for MVP, Swarm for Phase 2, K8s deferred to Phase 3
- MVP payment: manual screenshot verification via MTN MoMo / Orange Money
- AI screening: Claude vision via OpenRouter (strip markdown fences before JSON.parse)
- PaymentService abstraction implemented from day one for zero-refactor Phase 2 migration
- Branch promotion: feature → develop → staging → main (all require manual approval)
- Nothing merges to main without explicit developer approval + CI green
- NEVER use `public.is_admin()` in RLS — always `private.is_admin((select auth.uid()))`
- NEVER call OpenRouter from outside IntelligenceModule or AIModule
- `999` not `Infinity` for "unlimited" plan limits (Infinity serialises to null in JSON)
