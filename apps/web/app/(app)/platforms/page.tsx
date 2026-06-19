import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireUser } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { Topbar } from '../../../components/layout/topbar';
import {
  mapApiHealthCheck,
  PlatformHealthCard,
  type PlatformHealthCheck,
} from '../../../components/platforms/platform-health-card';
import { ConnectPlatforms } from '../../../components/platforms/connect-platforms';

export const metadata: Metadata = { title: 'Platforms' };

type ApiPlatformHealthRow = Parameters<typeof mapApiHealthCheck>[0];

interface ApiConnection {
  platform: string;
  status: string;
}

interface ApiFetchResult {
  checks: PlatformHealthCheck[];
  connectedPlatforms: string[];
}

async function fetchPlatformData(): Promise<ApiFetchResult> {
  const [healthResult, connectionsResult] = await Promise.allSettled([
    api.get<ApiPlatformHealthRow[]>('/platform-health'),
    api.get<ApiConnection[]>('/integration/connections'),
  ]);

  const checks =
    healthResult.status === 'fulfilled'
      ? healthResult.value.map((row, index) => mapApiHealthCheck(row, index))
      : [];

  const connectedPlatforms =
    connectionsResult.status === 'fulfilled'
      ? connectionsResult.value
          .filter((c) => c.status === 'active')
          .map((c) => c.platform)
      : [];

  return { checks, connectedPlatforms };
}

export default async function PlatformsPage() {
  const user = await requireUser();
  const { checks, connectedPlatforms } = await fetchPlatformData();
  const healthyCount = checks.filter((c) => c.status === 'healthy').length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Platform" />

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1a1a2e]">Platform health</h1>
            <p className="mt-2 max-w-2xl text-base text-[#888780]">
              Monitor connection status, response times, and errors for each linked platform.
            </p>
          </div>
          {checks.length > 0 && (
            <span className="text-sm text-[#787c91]">
              {healthyCount} of {checks.length} healthy
            </span>
          )}
        </div>

        {checks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cdd5e9] bg-white p-12 text-center">
            <p className="text-[#787c91]">
              No platform health data yet. Connect a platform to see status here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {checks.map((check) => (
              <PlatformHealthCard key={check.id} check={check} />
            ))}
          </div>
        )}

        <Suspense>
          <ConnectPlatforms connectedPlatforms={connectedPlatforms} />
        </Suspense>
      </div>
    </div>
  );
}
