# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifest files first to maximise layer cache
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json   ./packages/types/package.json
COPY apps/api/package.json         ./apps/api/package.json

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY turbo.json ./

RUN pnpm build --filter=api

# ── Stage 2: Production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json   ./packages/types/package.json
COPY apps/api/package.json         ./apps/api/package.json

RUN pnpm install --frozen-lockfile --prod

# Copy built output from builder
COPY --from=builder /app/packages/config/dist  ./packages/config/dist
COPY --from=builder /app/packages/types/dist   ./packages/types/dist
COPY --from=builder /app/apps/api/dist         ./apps/api/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
