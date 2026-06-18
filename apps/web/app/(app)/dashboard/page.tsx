import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Briefcase, Clock } from 'lucide-react';
import { requireUser } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { Topbar } from '../../../components/layout/topbar';
import { PlatformCard } from '../../../components/dashboard/platform-card';
import { DashboardStatCard } from '../../../components/dashboard/dashboard-stat-card';

export const metadata: Metadata = { title: 'Dashboard' };

interface PlatformSummary {
  platform: string;
  hasContent: boolean;
  qualityScore: number | null;
  marketScore: number | null;
  generatedAt: string | null;
  cached: boolean;
}

function displayName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
  const needsAttention = summaries.filter(
    (s) => s.hasContent && s.qualityScore !== null && s.qualityScore < 60,
  ).length;
  const pendingCount = summaries.filter((s) => !s.hasContent).length;

  const marketScores = summaries
    .map((s) => s.marketScore ?? s.qualityScore)
    .filter((s): s is number => s !== null);
  const avgMarketFit =
    marketScores.length > 0
      ? Math.round(marketScores.reduce((sum, s) => sum + s, 0) / marketScores.length)
      : null;

  const avgQuality =
    summaries.filter((s) => s.qualityScore !== null).reduce((sum, s) => sum + (s.qualityScore ?? 0), 0) /
    (summaries.filter((s) => s.qualityScore !== null).length || 1);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Dashboard" />

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-[28px] font-semibold text-[#1a1a2e]">
            {greeting}, {displayName(user.email)} 👋
          </h2>
          <p className="mt-2 text-sm text-[#787c91]">
            {avgMarketFit !== null
              ? `Your Market-Fit Score is ${avgMarketFit}${completedCount > 0 ? ' across connected platforms' : ''}.`
              : 'Complete your first interview to unlock your Market-Fit Score.'}
          </p>
        </div>

        {/* Quick actions */}
        <div className="mb-8 flex flex-wrap gap-6 border-b border-[#e2e8f0] pb-4">
          {[
            { label: 'Update all profiles', href: '/content' },
            { label: 'Generate Content', href: '/content' },
            { label: 'Start Interview', href: '/interview/linkedin' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="text-sm font-medium text-[#1a1a2e] transition hover:text-[#1d4e8a]"
            >
              {action.label}
            </Link>
          ))}
        </div>

        {/* Stats row — Figma layout mapped to API data */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardStatCard
            icon={<BarChart3 className="h-[22px] w-[22px] text-[#7c3aed]" strokeWidth={1.75} />}
            iconBg="rgba(124, 58, 237, 0.12)"
            label="Market-Fit Score"
            value={avgMarketFit !== null ? String(avgMarketFit) : '—'}
            trend={
              completedCount > 0
                ? {
                    text: `Avg quality ${Math.round(avgQuality)}/100 · ${user.plan} plan`,
                    positive: avgQuality >= 60,
                  }
                : undefined
            }
          />
          <DashboardStatCard
            icon={<Briefcase className="h-[22px] w-[22px] text-[#ea580c]" strokeWidth={1.75} />}
            iconBg="rgba(234, 88, 12, 0.12)"
            label="Profiles ready"
            value={`${completedCount} / ${summaries.length}`}
            trend={
              needsAttention > 0
                ? { text: `${needsAttention} need attention`, positive: false }
                : completedCount > 0
                  ? { text: 'All looking good', positive: true }
                  : undefined
            }
          />
          <DashboardStatCard
            icon={<Clock className="h-[22px] w-[22px] text-[#2563eb]" strokeWidth={1.75} />}
            iconBg="rgba(37, 99, 235, 0.12)"
            label="Pending approvals"
            value={String(pendingCount)}
            footer={
              pendingCount > 0 ? (
                <Link href="/content" className="text-xs font-medium text-[#1d4e8a] hover:underline">
                  → Review now
                </Link>
              ) : undefined
            }
          />
        </div>

        {/* Platform grid */}
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1a1a2e]">Your platforms</h3>
          <span className="text-sm text-[#787c91]">{summaries.length} connected</span>
        </div>

        {summaries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cdd5e9] bg-white p-12 text-center">
            <p className="text-[#787c91]">Could not load platform data. Please refresh the page.</p>
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
