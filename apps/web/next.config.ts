import type { NextConfig } from "next";
import withPWAInit from '@ducanh2912/next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 960, 1280, 1920],
    minimumCacheTTL: 86400,
    remotePatterns: [
      // Cloudflare R2 public bucket URLs (*.r2.dev) and custom domains
      { protocol: 'https', hostname: '**.r2.dev' },
      // Allow custom R2 domain if configured
      ...(process.env.NEXT_PUBLIC_R2_URL
        ? (() => {
            try {
              const { hostname } = new URL(process.env.NEXT_PUBLIC_R2_URL!);
              return [{ protocol: 'https' as const, hostname }];
            } catch {
              return [];
            }
          })()
        : []),
    ],
  },
};

const analyzeBundle = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
  fallbacks: { document: '/offline' },
});

export default analyzeBundle(withPWA(nextConfig));
