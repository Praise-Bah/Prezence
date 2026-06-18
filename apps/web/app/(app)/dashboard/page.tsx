import type { Metadata } from 'next';
import { requireUser } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { Topbar } from '../../../components/layout/topbar';
import { PlatformCard } from '../../../components/dashboard/platform-card';

export const metadata: Metadata = { title: 'Dashboard' };

interface PlatformSummary {
  platform: string;
  hasContent: boolean;
  qualityScore: number | null;
  marketScore: number | null;
  generatedAt: string | null;
  cached: boolean;
}

export default async function DashboardPage() {
  const user = await requireUser();

  let summaries: PlatformSummary[] = [];
  try {
    summaries = await api.get<PlatformSummary[]>('/content');
  } catch {
    // summaries stays empty — show empty state
  }

  const completedCount = summaries.filter((s) => s.hasContent).length;
  const avgQuality =
    summaries.filter((s) => s.qualityScore !== null).reduce((sum, s) => sum + (s.qualityScore ?? 0), 0) /
    (summaries.filter((s) => s.qualityScore !== null).length || 1);

  return (
    <div>
      <Topbar user={user} title="Dashboard" />
      <div className="p-6">
        {/* Stats bar */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Profiles ready', value: `${completedCount} / ${summaries.length}` },
            { label: 'Avg quality score', value: completedCount > 0 ? `${Math.round(avgQuality)}/100` : '—' },
            { label: 'Plan', value: user.plan.charAt(0).toUpperCase() + user.plan.slice(1) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Platform grid */}
        <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Your platforms
        </h2>
        {summaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">Could not load platform data. Please refresh the page.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaries.map((s) => (
              <PlatformCard key={s.platform} {...s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
