import type { Metadata } from 'next';
import { requireUser } from '../../../lib/auth';
import { api, ApiError } from '../../../lib/api';
import { Topbar } from '../../../components/layout/topbar';
import {
  mapApiHealthCheck,
  PlatformHealthCard,
  type PlatformHealthCheck,
} from '../../../components/platforms/platform-health-card';

export const metadata: Metadata = { title: 'Platforms' };

type ApiPlatformHealthRow = Parameters<typeof mapApiHealthCheck>[0];

interface ApiFetchResult {
  checks: PlatformHealthCheck[];
  apiStatus: 'ok' | 'empty' | '404' | 'error';
}

async function fetchPlatformHealth(): Promise<ApiFetchResult> {
  try {
    const data = await api.get<ApiPlatformHealthRow[]>('/platform-health');
    const checks = data.map((row, index) => mapApiHealthCheck(row, index));
    return { checks, apiStatus: checks.length > 0 ? 'ok' : 'empty' };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { checks: [], apiStatus: '404' };
    }
    return { checks: [], apiStatus: 'error' };
  }
}

export default async function PlatformsPage() {
  const user = await requireUser();
  const { checks } = await fetchPlatformHealth();

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
              No platform health data yet. Connect a platform and run a health check from the
              API to see status here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {checks.map((check) => (
              <PlatformHealthCard key={check.id} check={check} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
