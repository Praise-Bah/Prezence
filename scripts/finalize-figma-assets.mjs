import { mkdir, writeFile, copyFile, unlink, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'apps', 'web', 'public', 'assets');

/** @type {Array<{ url: string; out: string; figmaNodeId: string; figmaName: string; screens: string[]; role: string; width: number; height: number; format: 'png' | 'svg' | 'webp'; convertWebp?: boolean }>} */
const assets = [
  { url: 'https://www.figma.com/api/mcp/asset/bc1ca03c-3776-4d7f-b015-0cf026e93b5a', out: 'brand/shared-logo-mark@64x64.png', figmaNodeId: '440:7957', figmaName: 'Prezence logo 1', screens: ['landing-page', 'create-account-page', 'log-in-page', 'dashboard-screen', 'prezence-ai'], role: 'brand-mark', width: 64, height: 64, format: 'png' },
  { url: 'https://www.figma.com/api/mcp/asset/bbb83b27-2915-4f4f-84c5-7ed8c79245d0', out: 'brand/shared-logo-full@343x90.png', figmaNodeId: '440:7956', figmaName: 'Logo', screens: ['create-account-page', 'log-in-page'], role: 'logo', width: 343, height: 90, format: 'png' },
  { url: 'https://www.figma.com/api/mcp/asset/bbb83b27-2915-4f4f-84c5-7ed8c79245d0', out: 'brand/auth-logo-stack@343x90.png', figmaNodeId: '440:7956', figmaName: 'Logo', screens: ['create-account-page', 'log-in-page'], role: 'auth-logo-stack', width: 343, height: 90, format: 'png', skipDownload: true },
  { url: 'https://www.figma.com/api/mcp/asset/f27a0925-76ff-4aef-87eb-3175501f1e9d', out: 'brand/shared-logo-sidebar@133x32.png', figmaNodeId: '45:3916', figmaName: 'Logo (Collapsed=No)', screens: ['dashboard-screen'], role: 'sidebar-logo', width: 133, height: 32, format: 'png' },
  { url: 'https://www.figma.com/api/mcp/asset/4e9517a3-1554-4678-8d7a-a5676a8f9f75', out: 'brand/shared-logo-sidebar-icon@32x32.png', figmaNodeId: '45:3921', figmaName: 'Logo (Collapsed=Yes)', screens: ['dashboard-screen'], role: 'sidebar-logo-icon', width: 32, height: 32, format: 'png' },
  { url: 'https://www.figma.com/api/mcp/asset/eab38ed7-86f1-4023-87b5-e5b7316d2f54', out: 'backgrounds/landing-page-bg@1440x7000.webp', figmaNodeId: '355:6681', figmaName: 'bg', screens: ['landing-page'], role: 'background', width: 1440, height: 7000, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/2690d43e-f06d-4a12-a69f-f3206463ba9a', out: 'backgrounds/auth-split-panel@959x1112.webp', figmaNodeId: '440:7954', figmaName: 'Background image', screens: ['create-account-page', 'log-in-page'], role: 'split-panel-background', width: 959, height: 1112, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/866d976d-f8c8-4602-bc4d-d2b4b4a138ae', out: 'illustrations/landing-hero-ai-chat@644x517.webp', figmaNodeId: '355:6738', figmaName: 'Image (User chatting with Prezence AI on a smartphone)', screens: ['landing-page'], role: 'hero-illustration', width: 644, height: 517, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/e79fefa5-a257-40ac-845d-3537bfb9b15f', out: 'illustrations/landing-feature-card-a@544x362.webp', figmaNodeId: '355:6923', figmaName: 'Rectangle 41960', screens: ['landing-page'], role: 'feature-illustration', width: 544, height: 362, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/e90b0596-90e7-4ac3-bdd0-9c009da016b1', out: 'illustrations/landing-testimonial-amara@40x40.webp', figmaNodeId: '354:10243', figmaName: 'Image (Amara Tchamba)', screens: ['landing-page'], role: 'testimonial-avatar', width: 40, height: 40, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/3908d7c6-16c8-494e-8bee-f9a0d581c1aa', out: 'illustrations/landing-testimonial-kevin@40x40.webp', figmaNodeId: '354:10264', figmaName: 'Image (Kevin Mbeki)', screens: ['landing-page'], role: 'testimonial-avatar', width: 40, height: 40, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/52d1998a-35cc-46f5-9ba7-3ffc07f18ab9', out: 'illustrations/landing-testimonial-grace@40x40.webp', figmaNodeId: '354:10285', figmaName: 'Image (Grace Fominyam)', screens: ['landing-page'], role: 'testimonial-avatar', width: 40, height: 40, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/7b44c089-d716-4de0-a809-3133419aa640', out: 'misc/landing-logo-strip@848x64.png', figmaNodeId: '354:10663', figmaName: 'Image', screens: ['landing-page'], role: 'logo-strip', width: 848, height: 64, format: 'png' },
  { url: 'https://www.figma.com/api/mcp/asset/be6d6aec-4538-4e65-8e12-1b3c5f792d49', out: 'social/shared-google@24x24.svg', figmaNodeId: '12:2726', figmaName: 'Property 1=Google Logo', screens: ['create-account-page', 'log-in-page'], role: 'social-oauth', width: 24, height: 24, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/3435e465-f80f-459f-a744-fce602789837', out: 'social/shared-apple@24x24.svg', figmaNodeId: '12:2733', figmaName: 'Property 1=Apple Logo', screens: ['create-account-page', 'log-in-page'], role: 'social-oauth', width: 24, height: 24, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/a418c8cf-6e45-4f1e-878d-e38c518acd53', out: 'social/shared-facebook@24x24.svg', figmaNodeId: '12:2724', figmaName: 'Property 1=Facebook Logo', screens: ['create-account-page', 'log-in-page'], role: 'social-oauth', width: 24, height: 24, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/8813108d-73b8-42d7-bd81-3d9719ca942d', out: 'payments/shared-mtn-momo@44x44.svg', figmaNodeId: '493:10809', figmaName: 'MtnMomoBadge', screens: ['landing-page', 'subscription', 'payment-modal'], role: 'payment-badge', width: 44, height: 44, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/87c1afec-905c-47fc-b46b-1594d11fc23a', out: 'payments/shared-mtn-momo-wordmark@88x34.svg', figmaNodeId: '493:11150', figmaName: 'MtnMomoLogo', screens: ['payment-modal'], role: 'payment-wordmark', width: 88, height: 34, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/03703b71-7797-44b0-a6ae-47c3e1d04746', out: 'payments/shared-orange-money@44x44.svg', figmaNodeId: '493:10826', figmaName: 'OrangeMoneyBadge', screens: ['landing-page', 'subscription', 'payment-modal'], role: 'payment-badge', width: 44, height: 44, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/365acdda-f397-4387-b678-71ec71ae2b1a', out: 'payments/shared-orange-money-wordmark@99x34.svg', figmaNodeId: '493:11073', figmaName: 'OrangeMoneyLogo', screens: ['payment-modal'], role: 'payment-wordmark', width: 99, height: 34, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/8a3ce6c6-98b2-4979-a084-e19f554ea96c', out: 'payments/shared-visa@36x24.svg', figmaNodeId: '494:6853', figmaName: 'Icon - Visa', screens: ['landing-page'], role: 'payment-card', width: 36, height: 24, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/7d394e93-af10-468e-a0e7-fd767f710aef', out: 'payments/shared-mastercard@36x24.svg', figmaNodeId: '494:6856', figmaName: 'Icon - Mastercard', screens: ['landing-page'], role: 'payment-card', width: 36, height: 24, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/901e05c1-4bb7-433a-88d5-f85a1b09eb57', out: 'platforms/shared-fiverr@25x25.svg', figmaNodeId: '461:9128', figmaName: 'simple-icons:fiverr', screens: ['landing-page', 'dashboard-screen'], role: 'platform-logo', width: 25, height: 25, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/38ee8d33-1702-49c3-87e1-2f34ad2bfd97', out: 'platforms/shared-freelancer@39x29.svg', figmaNodeId: '368:3039', figmaName: 'Freelancer logo', screens: ['landing-page'], role: 'platform-logo', width: 39, height: 29, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/f5ecdf12-fe58-4a5f-b980-7ab1676c94f8', out: 'platforms/shared-upwork@40x24.svg', figmaNodeId: '367:3233', figmaName: 'Upwork logo', screens: ['landing-page'], role: 'platform-logo', width: 40, height: 24, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/a0569a5e-bbe5-4037-a26a-56574933d89c', out: 'platforms/shared-instagram@18x18.svg', figmaNodeId: '45:2368', figmaName: 'IONIcon/L/logo/instagram', screens: ['profile-screen', 'dashboard-screen'], role: 'platform-logo', width: 18, height: 18, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/35e98ead-4fc1-41b0-b524-1397dfca1044', out: 'platforms/shared-twitter@21x21.svg', figmaNodeId: '45:2367', figmaName: 'IONIcon/L/logo/twitter', screens: ['profile-screen', 'dashboard-screen'], role: 'platform-logo', width: 21, height: 21, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/1dbbc71b-e000-4a0b-b9f1-be96e195bdec', out: 'platforms/shared-platform-logo@36x36.svg', figmaNodeId: '329:5907', figmaName: 'PlatformLogo', screens: ['platform-health-dashboard'], role: 'platform-logo', width: 36, height: 36, format: 'svg' },
  { url: 'https://www.figma.com/api/mcp/asset/84bedd85-1332-422f-9f36-b040c57e0e0c', out: 'illustrations/shared-upgrade-hero@280x221.webp', figmaNodeId: '45:3981', figmaName: 'Upgrade Hero', screens: ['dashboard-screen', 'prezence-ai', 'generate-content', 'notification', 'platforms', 'profile-screen'], role: 'upgrade-card', width: 280, height: 221, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/3c14fe6f-598d-4cca-8687-3b958637a1bb', out: 'illustrations/shared-upgrade-illustration@248x165.webp', figmaNodeId: '45:3983', figmaName: 'Moneyverse Home Office', screens: ['dashboard-screen', 'prezence-ai', 'generate-content', 'notification', 'platforms', 'profile-screen'], role: 'upgrade-illustration', width: 248, height: 165, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/2d67af10-d82b-424a-ba96-3644910d5a17', out: 'placeholders/shared-user-avatar@40x40.webp', figmaNodeId: '45:3953', figmaName: 'Avatar (Collapsed=Yes)', screens: ['dashboard-screen', 'profile-screen'], role: 'placeholder-avatar', width: 40, height: 40, format: 'webp', convertWebp: true },
  { url: 'https://www.figma.com/api/mcp/asset/f69385d8-aff7-4c3b-8d73-117ad863bf9a', out: 'placeholders/shared-user-avatar@72x72.webp', figmaNodeId: '312:8009', figmaName: 'Big Shoes Avatar', screens: ['dashboard-screen', 'profile-screen'], role: 'placeholder-avatar', width: 72, height: 72, format: 'webp', convertWebp: true },
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${dest}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error(`Empty file for ${dest}`);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
}

async function convertToWebp(pngPath, webpPath) {
  execSync(`npx --yes sharp-cli -i "${pngPath}" -o "${webpPath}" -f webp`, {
    stdio: 'pipe',
  });
}

const created = [];

for (const asset of assets) {
  const dest = join(root, asset.out);
  if (asset.skipDownload) {
    const source = join(root, 'brand/shared-logo-full@343x90.png');
    await copyFile(source, dest);
    created.push(asset.out);
    continue;
  }

  const tempDest = asset.convertWebp ? dest.replace(/\.webp$/, '.tmp.png') : dest;
  await download(asset.url, tempDest);

  if (asset.convertWebp) {
    await convertToWebp(tempDest, dest);
    await unlink(tempDest);
  }

  created.push(asset.out);
}

const manifest = {
  version: 1,
  figmaFile: 'https://www.figma.com/design/IhSLWUKuuxCEqsj8tHM6Nh/Prezence',
  exportedAt: new Date().toISOString(),
  assets: assets.map(({ out, figmaNodeId, figmaName, screens, role, width, height, format }) => ({
    path: `/assets/${out}`,
    figmaNodeId,
    figmaName,
    screens,
    role,
    width,
    height,
    format,
  })),
};

await writeFile(join(root, 'assets-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({ createdCount: created.length, created }, null, 2));
