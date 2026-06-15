# Prezence — CLAUDE.md

## Project Identity
AI-powered personal branding platform for Cameroonian & sub-Saharan African youth.
Monorepo: NestJS API + Next.js 14 web + React Native (Expo) mobile.
Owner: Praise Bucuzong Bah. All decisions reference PRZ-SRS-003 v3.0.

## Stack
- Backend: NestJS 10, TypeScript strict, Node.js 20 LTS
- Web: Next.js 14 App Router, TypeScript, Tailwind CSS, PWA
- Mobile: React Native Expo SDK 51+, TypeScript
- Database: PostgreSQL 15 + pgvector (Supabase)
- Cache/Queue: Redis 7 via Upstash + BullMQ
- Storage: Cloudflare R2
- AI: OpenRouter API (Claude Sonnet for generation, Gemini Flash for QA)
- Payments: Flutterwave (primary), Paystack (Phase 2), Stripe (Phase 3)
- Secrets: Doppler

## Monorepo Structure
apps/api       → NestJS backend
apps/web       → Next.js frontend
apps/mobile    → React Native Expo
packages/types → shared TypeScript interfaces and Zod schemas
packages/ui    → shared React components (web)
packages/config → shared ESLint, TSConfig

## NestJS Module Boundaries — STRICT
AuthModule, AIModule, IntelligenceModule, IntegrationModule,
BillingModule, ContentModule, PlatformHealthModule, NotificationModule.
Never import across module boundaries without going through the module's
exported service. No circular imports.

## Critical Architecture Rules — NEVER VIOLATE
- NEVER call Flutterwave, Paystack, or Stripe directly from business logic.
  Always use PaymentService abstraction in BillingModule.
- NEVER store OAuth tokens in plaintext. Always AES-256-GCM envelope encryption.
- NEVER log tokens, secrets, or PII. All logs use anonymized user IDs.
- NEVER call OpenRouter from outside IntelligenceModule or AIModule.
- NEVER add Kubernetes configs — Docker Compose for MVP, Swarm for Phase 2.
- NEVER bypass PaymentService. Not even for quick tests.

## Patterns to Follow
- Use class-validator DTOs on every NestJS controller input
- Use TypeORM with parameterized queries only — no raw string interpolation
- BullMQ for all async jobs — never await browser automation inline
- Versioned cache keys: gen:${userId}:${platform}:v${interviewVersion}
- Idempotent webhooks via UNIQUE constraint on provider_event_id

## Testing Requirements
- Minimum 70% coverage on AuthModule, AIModule, IntelligenceModule, BillingModule
- Every new service method needs a unit test before the PR merges
- E2E tests in /apps/api/test/ using Supertest

## Commands
- Dev (all): pnpm dev
- Dev (api only): pnpm dev --filter=api
- Dev (web only): pnpm dev --filter=web
- Test: pnpm test --filter=api
- Lint: pnpm lint
- Build: pnpm build

## When Debugging
1. Isolate the bug to the smallest reproduction first
2. Write a failing test that demonstrates it before asking for a fix
3. State your hypothesis about root cause before I suggest anything
4. After fixing, update this CLAUDE.md if the fix reveals a missing rule
5. Update TASKS.md to mark the bug resolved

## Before Every Commit
- Always run `pnpm lint && pnpm typecheck` from the root before committing
  anything that touches config, package.json, or CI files
- Always run `gh run list --branch develop --limit 1` and wait for green
  after every push
- Never declare a task done until CI is confirmed green

## What We Are Building Right Now
See TASKS.md for current sprint status.
