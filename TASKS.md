# Prezence — Build Progress

## ✅ Done
- GitHub repo created (github.com/Praise-Bah/Prezence, private)
- Branch protection ruleset on main (PR required, squash merge, block force push, lint-and-test required)
- CLAUDE.md created
- TASKS.md created
- Monorepo scaffold (Turborepo + pnpm workspaces)
- CI green on develop (lint-and-test passing)
- Claude Code skills created (prezence-patterns, nestjs-module, billing-patterns, security-patterns, nestjs-expert)
- MCP servers configured (.mcp.json: supabase-read, supabase-write, sentry, playwright, context7)
- Cursor rules created (.cursor/rules/: base, nestjs-api, nextjs-web, debugging, security)

## 🔄 In Progress
- NestJS API initial module structure
- AuthModule: JWT + refresh token rotation

## 📋 Up Next
- Figma MCP plugin install + authentication (manual — `claude` CLI not available in this environment)
- Context7 MCP global registration + `claude mcp list` verification (manual — `claude` CLI not available in this environment)
- Supabase project + pgvector setup
- AuthModule: rate limiting
- Doppler secrets setup
- Greptile custom rules configured

## 🚧 Blockers / Open Decisions
- `claude` CLI binary not available in this VSCode-extension environment — blocks `claude plugin install` and `claude mcp add/list` commands. Run these manually from a terminal with the Claude Code CLI installed.

## 📐 Locked Architectural Decisions
- Flutterwave primary payments (BEAC-licensed Cameroon June 2025)
- AES-256-GCM envelope encryption for all OAuth tokens
- Composio rejected — all L1 integrations built directly in NestJS
- pgvector in PostgreSQL — no separate vector DB
- OpenRouter for all AI model routing
- Modular monolith — no microservices until Phase 3
- Docker Compose for MVP, Swarm for Phase 2, K8s deferred to Phase 3
