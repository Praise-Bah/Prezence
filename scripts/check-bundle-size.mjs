/**
 * Fails CI if any JS chunk in the Next.js build exceeds THRESHOLD_BYTES.
 * To skip: create .bundle-size-override at the repo root with a justification comment.
 */
import { readdirSync, statSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const THRESHOLD_BYTES = 500 * 1024; // 500 KB uncompressed per chunk
const OVERRIDE_FILE = '.bundle-size-override';
const CHUNKS_DIR = resolve('apps/web/.next/static/chunks');

if (existsSync(OVERRIDE_FILE)) {
  const note = (await import('fs')).readFileSync(OVERRIDE_FILE, 'utf8').trim();
  console.log(`Bundle size check skipped — override in effect:\n  ${note || '(no reason given)'}`);
  process.exit(0);
}

if (!existsSync(CHUNKS_DIR)) {
  console.error(`[bundle-check] Build output not found at ${CHUNKS_DIR}.`);
  console.error('Run `pnpm build --filter=web` before running this script.');
  process.exit(1);
}

const files = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith('.js'));

let failed = false;
const oversized = [];

for (const file of files) {
  const size = statSync(join(CHUNKS_DIR, file)).size;
  const kb = (size / 1024).toFixed(1);
  if (size > THRESHOLD_BYTES) {
    oversized.push({ file, kb });
    failed = true;
  }
}

if (failed) {
  console.error(`\n[bundle-check] FAILED — ${oversized.length} chunk(s) exceed ${THRESHOLD_BYTES / 1024} KB:\n`);
  for (const { file, kb } of oversized) {
    console.error(`  ✗ ${file}  ${kb} KB`);
  }
  console.error(`\nTo override, create .bundle-size-override with a justification comment.`);
  process.exit(1);
} else {
  console.log(`[bundle-check] OK — all ${files.length} chunks are within ${THRESHOLD_BYTES / 1024} KB.`);
}
