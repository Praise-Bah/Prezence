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
- Figma plugin installed (`claude plugin install figma@claude-plugins-official`) — needs one-time OAuth via `/plugin` menu
- Claude Code CLI installed; Figma, GitHub, Supabase, Sentry, Google Drive also connected as personal claude.ai OAuth connectors
- Cursor rules created (.cursor/rules/: base, nestjs-api, nextjs-web, debugging, security)
- Supabase project linked (ref ggjglhekhexsktmihtlo) + pgvector extension enabled (v0.8.0)
- Doppler project "prezence" / config "dev" populated with all dev secrets
- .env.example created at monorepo root
- supabase/ folder structure created (migrations/, seed/)
- App dev scripts wrapped with `doppler run --` (apps/api, apps/web), with `:ci` fallbacks
- Upstash Redis connected and tested
- OpenRouter API key added and screenshot AI capability verified (model: `anthropic/claude-sonnet-4.6`)
- Founder MoMo/Orange Money numbers added to Doppler
- Screenshot payment secrets configured in Doppler
- shared packages/types created (includes ScreenshotScreeningResult, SubscriptionRequest types)
- shared packages/config created (includes SCREENING thresholds, QUEUE_NAMES, PLAN_PRICES)
- Workspace package links wired into api and web apps
- Full pre-build environment verified
- Branch automation workflows created
  (develop→staging auto-PR, staging→main auto-PR, production deploy notification)
- GitHub labels created (automated, staging-deploy, production-deploy)
- Staging branch protection added (require lint-and-test + 1 approving review)
- Phase 0 database foundation merged (PR #4): 12 Supabase migrations covering
  users, subscription_requests, platform_connections, profile_data,
  automation_jobs, market_scores, ai_embeddings/prompt_registry, audit_logs,
  payment_events — all RLS-enabled, applied to project ggjglhekhexsktmihtlo,
  security/performance advisors clean
- AuthModule merged (PR #5): custom JWT auth decoupled from Supabase auth.users;
  access tokens (15 min) + refresh tokens (7 days) with rotation and reuse-detection;
  Redis lockout (5 fails → 15 min) + rate limiting; global JWT/Roles/RateLimit guard
  chain; 29 unit tests; CI green

## 🔄 In Progress
- NestJS API initial module structure

## 📋 Up Next
1. Apply auth migrations via Cursor+Supabase MCP (20260616090001, 20260616090002) and verify advisors clean
2. BillingModule — screenshot upload, AI screening, admin review workflow
3. IntelligenceModule — RAG pipeline, prompt registry, model routing
4. IntegrationModule — L3A Playwright workers

## 🚧 Blockers / Open Decisions
- supabase-read/write and github MCP servers point to packages installed locally at `~/.mcp-servers/{supabase,github}` (npx hits a Node 22 ESM resolution bug for `@supabase/mcp-server-supabase` on Windows). Each developer must run, once:
  ```
  mkdir -p ~/.mcp-servers/supabase && cd ~/.mcp-servers/supabase && npm install @supabase/mcp-server-supabase zod
  mkdir -p ~/.mcp-servers/github && cd ~/.mcp-servers/github && npm install @modelcontextprotocol/server-github
  ```
  and update the absolute paths in `.mcp.json` to match their own home directory (currently hardcoded to `C:\Users\Praise Bah\...`).
- Figma MCP (`plugin:figma:figma`) shows "Needs authentication" — run `/plugin` in Claude Code, select `figma` under Installed, press Enter to start OAuth, approve in the browser.
- On Windows + git-bash, `doppler run` sometimes fails with "you must provide a token" due to path-scope matching; fix by passing `--scope 'C:\Users\<you>\Downloads\Prezence'` explicitly.
- sentry/playwright/context7 MCP servers intermittently show "Failed to connect" during `claude mcp list` health checks — this is npx cold-start latency exceeding the health-check timeout, not a config issue; they reconnect on retry.
- `SENTRY_DSN_API` was overwritten with a placeholder value (`placeholder_sentry_api_dsn`) per Step 4 — it previously held a real DSN from Step 3. Doppler retains version history if it needs restoring.
- OpenRouter/Claude model returns markdown-fenced JSON (` ```json ... ``` `) even with `response_format: json_object` — production screenshot-screening code must strip code fences before `JSON.parse`.

## 📐 Locked Architectural Decisions
- AES-256-GCM envelope encryption for all OAuth tokens
- Composio rejected — all L1 integrations built directly in NestJS
- pgvector in PostgreSQL — no separate vector DB
- OpenRouter for all AI model routing
- Modular monolith — no microservices until Phase 3
- Docker Compose for MVP, Swarm for Phase 2, K8s deferred to Phase 3
- MVP payment: manual screenshot verification via MTN MoMo / Orange Money
- AI screening: Claude `anthropic/claude-sonnet-4.6` via OpenRouter (strip markdown fences from response before JSON.parse)
- No Flutterwave keys in dev — placeholder values only until business account approved
- PaymentService abstraction implemented from day one for zero-refactor Phase 2 migration
- Branch promotion is automated via GitHub Actions
- Manual approval required at each stage (develop→staging, staging→main)
- Nothing merges to main without explicit developer approval
