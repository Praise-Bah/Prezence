# Prezence — Code Review Checklist for Cursor Composer

> **How to use this file**
> When Claude Code finishes a section, open Cursor Composer and type:
> `@REVIEW.md @codebase Review everything changed in the last commit. Follow this checklist exactly. Report every finding.`
> Cursor will read your full codebase + this file and give you a Greptile-style review.
> Fix every finding before moving to the next section.

---

## About This Codebase

**Stack:** NestJS 10 (apps/api) + Next.js 14 (apps/web) + React Native Expo (apps/mobile)
**Database:** PostgreSQL 15 + pgvector on Supabase. Project: ggjglhekhexsktmihtlo
**Queue:** BullMQ on Upstash Redis
**Auth:** Custom JWT — 15-min access token (httpOnly cookie: prezence_at) + 7-day refresh token (httpOnly cookie: prezence_rt) with family-based reuse detection
**Payments:** MTN MoMo + Orange Money via screenshot verification. Claude vision screens the screenshot.
**AI:** OpenRouter gateway — Claude claude-sonnet-4.6 for generation/vision, Gemini 2.5 Flash for scoring, Llama 3.3 for RAG
**Encryption:** AES-256-GCM envelope encryption on all stored OAuth tokens via TokenVaultService
**Secrets:** All from Doppler — never hardcoded, never in .env files committed to git

---

## Review Checklist

Work through every category below. For every finding, report:
- **File and line number**
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW
- **What the problem is**
- **Exact fix** (show the corrected code, not just a description)

If a category has no findings, write "✅ Clean" next to it. Do not skip any category.

---

### CATEGORY 1 — Authentication & Authorisation

- [ ] Every endpoint in `apps/api/src/*/*.controller.ts` that is not explicitly `@Public()` must have `@UseGuards(JwtAuthGuard)`. List any endpoint missing this guard.
- [ ] Every endpoint that returns user data must filter by `currentUser.id`. Look for any query that fetches from `users`, `profile_data`, `platform_connections`, `automation_jobs`, `market_scores`, `subscription_requests`, or `notifications` without a `WHERE user_id = $currentUserId` clause. Flag any that could return another user's data.
- [ ] The `@Roles()` decorator must be present on any endpoint that should be restricted to `system_admin` or `support`. Check all admin billing endpoints and health check mutation endpoints.
- [ ] Refresh token reuse: when a refresh token is used, the old one must be deleted and a new one issued. If a previously used token is presented again, the entire token family must be revoked. Verify this logic exists and is tested.
- [ ] JWT errors must never expose a stack trace or internal error message to the client. Check all JwtAuthGuard error handlers.
- [ ] Password fields (`password`, `currentPassword`, `newPassword`) must never appear in any log statement, response object, or serialised entity. Check for accidental inclusion.
- [ ] bcrypt cost factor must be 12. Flag any `bcrypt.hash()` call with a cost factor below 12.

---

### CATEGORY 2 — Input Validation

- [ ] Every controller method that accepts a `@Body()` must have a corresponding DTO class with class-validator decorators. Flag any `@Body() body: any` or `@Body() body: object` without a typed DTO.
- [ ] Every DTO that accepts a string field must have `@IsString()` and either `@MaxLength()` or an explicit justification for why no max length is needed.
- [ ] UUIDs received as `@Param()` must be validated with `@IsUUID()`. Flag any route param used directly in a DB query without UUID validation.
- [ ] File uploads (screenshots) must be validated: check file type (image/jpeg, image/png only), check file size (reject anything over 10MB), and verify EXIF is stripped before storage. Flag any missing validation.
- [ ] Enum values received from the client (platform names, plan names, payment methods) must be validated against the enums in `packages/types`. Flag any string that is used as a platform or plan identifier without enum validation.

---

### CATEGORY 3 — Security

- [ ] **No hardcoded secrets.** Scan every changed file for any string that looks like an API key, token, password, or connection string. Flag anything that is not `process.env.VARIABLE_NAME` or retrieved from Doppler.
- [ ] **SQL injection.** All database queries must use parameterised queries or the Supabase client's typed query builder. Flag any string concatenation inside a SQL query.
- [ ] **CSRF.** OAuth flows must validate the `state` parameter matches what was stored in the session before exchanging the code for a token. Flag any OAuth callback that skips state validation.
- [ ] **Token storage.** OAuth tokens stored in `platform_connections` must go through `TokenVaultService` (AES-256-GCM). Flag any code path that writes a token directly to the database without encryption.
- [ ] **Password reset tokens.** The raw token must never be stored — only its SHA-256 hash. Flag any code that stores the raw reset token.
- [ ] **Sensitive data in URLs.** Reset tokens, OAuth codes, and session identifiers must never appear in URL path segments where they could be logged by Nginx or Cloudflare. They should be query params on HTTPS connections (acceptable) or POST body (preferred). Flag any case where a secret is in a URL path.
- [ ] **Error messages.** API error responses must not include stack traces, internal table names, or file paths. Check all `catch` blocks and exception filters for accidental internal detail exposure.
- [ ] **Rate limiting.** Auth endpoints (`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`) must be covered by the Redis sliding-window rate limiter. Verify the `RateLimitGuard` is applied to these routes.

---

### CATEGORY 4 — Data Integrity

- [ ] **Duplicate prevention.** Any INSERT that should be unique (notification per event, subscription request per transaction, payment event per provider_event_id) must use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`. Flag any bare INSERT into a table with a UNIQUE constraint that could throw on duplicate.
- [ ] **Upserts not inserts.** Market scores and voice preferences are upsert operations — `ON CONFLICT (user_id, platform) DO UPDATE`. Flag any code that does a plain INSERT into `market_scores` or updates `voice_preferences` without upsert semantics.
- [ ] **Soft deletes.** The `users` table uses `deleted_at` for soft deletes. Any query that reads user data must include `WHERE deleted_at IS NULL`. Flag any user query missing this filter.
- [ ] **BullMQ job payloads.** Every BullMQ worker must validate its job payload before processing. Flag any worker that uses `job.data.field` without first checking that the field exists and is the expected type.
- [ ] **Transaction boundaries.** Operations that update multiple tables (e.g. confirming a payment updates `subscription_requests` AND sends a notification AND logs to `audit_logs`) should either be in a database transaction or be explicitly documented as eventually consistent. Flag any multi-table write with no transaction boundary and no comment explaining the consistency model.

---

### CATEGORY 5 — AI Response Handling

- [ ] **JSON fence stripping.** Every call to `JSON.parse()` on an AI model response must first apply:
  ```typescript
  const clean = response.replace(/```json\n?|\n?```/g, '').trim();
  ```
  Flag any `JSON.parse(aiResponse)` that does not strip fences first.
- [ ] **Single system message.** No API call to OpenRouter should include more than one `{ role: 'system' }` entry in the messages array. Flag any `messages` array construction that could produce two system messages.
- [ ] **Structured output schema.** Every AI call that expects structured JSON must pass an `output_schema` to `ModelRouterService`. Flag any AI call that expects JSON but does not pass a schema.
- [ ] **Quality gate.** Profile generation must pass through `QualityGateService` before being stored. Flag any code path that stores generated profile content without a quality gate check.
- [ ] **Token counting.** `AiUsageService.log()` must be called with real `promptTokens`, `completionTokens`, and `totalTokens` from the OpenRouter response. Flag any call that passes hardcoded 0 for any token count.
- [ ] **AI error handling.** Every call to `ModelRouterService` must have a try/catch. Flag any unhandled AI call where a model timeout or rate limit error would propagate as an unhandled exception.

---

### CATEGORY 6 — TypeScript Type Safety

- [ ] Run `pnpm typecheck` mentally over the changed files. Flag any usage of `any` that could be replaced with a proper type from `packages/types`.
- [ ] All async functions must have explicit return type annotations. Flag any `async function` without a return type.
- [ ] BullMQ job data types must use the typed interfaces from `packages/types` (e.g. `ContentGenerationJobData`). Flag any `Queue.add()` call that passes an untyped object.
- [ ] Supabase query results are typed — flag any `.data` destructured from a Supabase response that is then used without checking `error` first.
- [ ] All DTOs must be used with `@Body() dto: MyDto` — the type must match the DTO class, not a plain `object` or `Record<string, unknown>`.

---

### CATEGORY 7 — BullMQ & Worker Health

- [ ] Every BullMQ worker must have a `concurrency` setting that matches the server's capacity (Automation Server: max 10 concurrent Playwright, Application Server: max 5 concurrent email/intelligence workers).
- [ ] Every job added to a queue must have a `attempts` setting (recommended: 3) and a `backoff` strategy (`{ type: 'exponential', delay: 5000 }`). Flag any `queue.add()` with no retry configuration.
- [ ] Workers must handle the case where a job fails all retries — move to a dead-letter queue or log to `audit_logs`. Flag any worker with no failed-job handler.
- [ ] Cron jobs (nightly voice learning, 6h health checks) must use `removeOnComplete: true` to prevent the completed job list from growing unboundedly. Flag any repeatable job missing this setting.

---

### CATEGORY 8 — Frontend & UX

- [ ] Every page that fetches data from the API must have a corresponding `loading.tsx` file (Next.js App Router). Flag any `page.tsx` with a `fetch()` or Server Action call and no `loading.tsx` sibling.
- [ ] Every page with a `fetch()` or Server Action must have a corresponding `error.tsx` file. Flag any page missing an error boundary.
- [ ] Server Actions must never expose internal error messages to the client. Catch errors in Server Actions and return `{ error: 'Something went wrong' }` — never `{ error: err.message }` from a database or network error.
- [ ] The `API_URL` environment variable used in Server Actions must be the internal server-to-server URL (not `NEXT_PUBLIC_`). Flag any Server Action that uses `process.env.NEXT_PUBLIC_API_URL`.
- [ ] WebSocket connections opened in `useEffect` must be closed in the cleanup function. Flag any `socket.connect()` without a corresponding `socket.disconnect()` in the return of `useEffect`.
- [ ] Forms that submit to Server Actions must disable the submit button while the action is pending (use `useFormStatus` or `useState` loading flag). Flag any form with no submission loading state.

---

### CATEGORY 9 — Tests

- [ ] Every new endpoint added must have at least one unit test. Flag any new controller method with no corresponding test in `*.spec.ts`.
- [ ] Tests must not share state between test cases. Flag any test that relies on a previous test having run first (no `beforeAll` that mutates state used by multiple `it` blocks without reset).
- [ ] Mock return values must match the actual return type of the service being mocked. Flag any `jest.fn().mockResolvedValue(undefined)` where the real function returns a typed object.
- [ ] Tests for auth-protected endpoints must test both the authenticated case (should succeed) and the unauthenticated case (should return 401). Flag any endpoint test that only tests the happy path.

---

### CATEGORY 10 — Performance

- [ ] Any endpoint that queries the database without a `LIMIT` on a potentially large table (`notifications`, `automation_jobs`, `audit_logs`) must have a maximum result cap. Flag any unbounded query.
- [ ] Redis cache reads must happen before database queries on any hot path (dashboard, profile, score). Flag any endpoint that queries the database without checking the Redis cache first when a cache exists for that data.
- [ ] N+1 query patterns: flag any loop that runs a database query inside each iteration. All data needed for a list response should be fetched in a single query with a join or `IN` clause.

---

## Severity Guide

| Severity | Meaning | Must fix before? |
|---|---|---|
| CRITICAL | Security vulnerability, data loss risk, or broken auth | Immediately — do not continue |
| HIGH | Logic error, missing validation, or unhandled error that will cause user-facing bugs | Before moving to next section |
| MEDIUM | Type safety issue, missing test, or suboptimal pattern | Before opening PR to staging |
| LOW | Code style, naming, or minor improvement | Before opening PR to main |

---

## How to Give This Review to Cursor Composer

Open Cursor Composer (Cmd+I or Ctrl+I) and type exactly:

```
@REVIEW.md @codebase

I just finished [describe what you built — e.g. "the email worker in NotificationModule and wired it to Resend"].

Review all changed files against the checklist in REVIEW.md.
Go through every category.
For every finding report: file, line, severity, problem, and exact fix.
Write "✅ Clean" for any category with no findings.
Do not skip any category.
After listing all findings, give me a summary: how many CRITICAL, HIGH, MEDIUM, LOW.
```

Fix every CRITICAL and HIGH before continuing. Fix MEDIUM and LOW before the next PR to staging.
