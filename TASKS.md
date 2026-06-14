# Prezence — Build Progress

## ✅ Done
- GitHub repo created (github.com/Praise-Bah/Prezence, private)
- Branch protection ruleset on main (PR required, squash merge, block force push)
- CLAUDE.md created
- TASKS.md created
- Monorepo scaffold (Turborepo + pnpm workspaces)

## 🔄 In Progress
- NestJS API initial module structure
- AuthModule: JWT + refresh token rotation

## 📋 Up Next
- Supabase project + pgvector setup
- AuthModule: rate limiting
- Doppler secrets setup
- Greptile custom rules configured

## 🚧 Blockers / Open Decisions
- None yet

## 📐 Locked Architectural Decisions
- Flutterwave primary payments (BEAC-licensed Cameroon June 2025)
- AES-256-GCM envelope encryption for all OAuth tokens
- Composio rejected — all L1 integrations built directly in NestJS
- pgvector in PostgreSQL — no separate vector DB
- OpenRouter for all AI model routing
- Modular monolith — no microservices until Phase 3
- Docker Compose for MVP, Swarm for Phase 2, K8s deferred to Phase 3
