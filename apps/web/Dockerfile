# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json   ./packages/types/package.json
COPY apps/web/package.json         ./apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY turbo.json ./

RUN pnpm build --filter=web

# ── Stage 2: Production runtime ──────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json   ./packages/types/package.json
COPY apps/web/package.json         ./apps/web/package.json

RUN pnpm install --frozen-lockfile --prod

# Copy Next.js standalone output
COPY --from=builder /app/apps/web/.next/standalone ./apps/web/.next/standalone
COPY --from=builder /app/apps/web/.next/static     ./apps/web/.next/standalone/apps/web/.next/static
COPY --from=builder /app/apps/web/public           ./apps/web/.next/standalone/apps/web/public

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]
