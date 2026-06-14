# Prezence — Build Progress

## ✅ Done
- GitHub repo created (github.com/Praise-Bah/Prezence, private)
- Branch protection ruleset on main (PR required, squash merge, block force push, lint-and-test required)
- CLAUDE.md created
- TASKS.md created
- Monorepo scaffold (Turborepo + pnpm workspaces)
- CI green on develop (lint-and-test passing)
- Claude Code skills created (prezence-patterns, nestjs-module, billing-patterns, security-patterns, nestjs-expert)
- MCP servers configured (.mcp.json: supabase-read, supabase-write, sentry, playwright, context7, github, figma)
- Cursor rules created (.cursor/rules/: base, nestjs-api, nextjs-web, debugging, security)
- Supabase project linked (ref ggjglhekhexsktmihtlo) + pgvector extension enabled (v0.8.0)
- Doppler project "prezence" / config "dev" populated with all dev secrets
- .env.example created at monorepo root
- supabase/ folder structure created (migrations/, seed/)
- App dev scripts wrapped with `doppler run --` (apps/api, apps/web), with `:ci` fallbacks

## 🔄 In Progress
- NestJS API initial module structure
- AuthModule: JWT + refresh token rotation

## 📋 Up Next
- AuthModule: rate limiting
- AuthModule: complete JWT + refresh token rotation implementation
- Upstash Redis setup + Doppler secrets
- OpenRouter integration + Doppler secrets
- Flutterwave integration + Doppler secrets
- Greptile custom rules configured

## 🚧 Blockers / Open Decisions
- `claude` CLI binary not available in this VSCode-extension environment — blocks `claude plugin install` and `claude mcp add/list` commands. GitHub and Figma MCP servers were added manually to `.mcp.json` (merged, not overwritten) and need verification via `claude mcp list` from a terminal with the Claude Code CLI installed.
- Rotate exposed credentials: Supabase service_role key, GitHub PAT, Sentry auth token, and Figma token were pasted in chat during setup and should be regenerated/rotated, then updated in Doppler.

## 📐 Locked Architectural Decisions
- Flutterwave primary payments (BEAC-licensed Cameroon June 2025)
- AES-256-GCM envelope encryption for all OAuth tokens
- Composio rejected — all L1 integrations built directly in NestJS
- pgvector in PostgreSQL — no separate vector DB
- OpenRouter for all AI model routing
- Modular monolith — no microservices until Phase 3
- Docker Compose for MVP, Swarm for Phase 2, K8s deferred to Phase 3
