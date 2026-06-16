#!/usr/bin/env bash
set -e

echo "=== pnpm lint ==="
pnpm lint

echo "=== pnpm typecheck ==="
pnpm typecheck

echo "=== pnpm test --filter=api ==="
pnpm test --filter=api

echo "=== All checks passed ==="
