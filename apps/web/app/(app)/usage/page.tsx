import type { Metadata } from 'next';
import { Activity, Coins, Zap } from 'lucide-react';
import { requireUser } from '../../../lib/auth';
import { getUserUsageAction, getSystemUsageAction } from '../../../lib/actions/usage.actions';
import type { UserUsageSummary, SystemUsageSummary } from '../../../lib/actions/usage.actions';
import { Topbar } from '../../../components/layout/topbar';

export const metadata: Metadata = { title: 'AI Usage' };

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function shortModel(model: string): string {
  return model.split('/').pop() ?? model;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-6 py-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff]">
        <Icon className="h-5 w-5 text-[#1d4e8a]" />
      </div>
      <div>
        <p className="text-sm text-[#717182]">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-[#1a1a2e]">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-[#717182]">{sub}</p>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
      <div className="border-b border-[#e2e8f0] px-6 py-4">
        <h3 className="text-sm font-semibold text-[#1a1a2e]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function UserUsageSection({ data }: { data: UserUsageSummary }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Activity}
          label="Total requests"
          value={String(data.totalRequests)}
          sub={`Last ${data.periodDays} days`}
        />
        <StatCard
          icon={Zap}
          label="Total tokens"
          value={formatTokens(data.totalTokens)}
          sub="Prompt + completion"
        />
        <StatCard
          icon={Coins}
          label="Estimated cost"
          value={data.totalCostUsd !== null ? `$${data.totalCostUsd.toFixed(4)}` : '—'}
          sub="USD"
        />
      </div>

      {data.byModel.length > 0 && (
        <SectionCard title="By model">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] text-left text-xs font-medium text-[#717182]">
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3 text-right">Requests</th>
                <th className="px-6 py-3 text-right">Tokens</th>
                <th className="px-6 py-3 text-right">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {data.byModel.map((row) => (
                <tr key={row.model} className="hover:bg-[#f8f9fa]">
                  <td className="px-6 py-3 font-mono text-xs text-[#1a1a2e]">{shortModel(row.model)}</td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{row.requests}</td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{formatTokens(row.totalTokens)}</td>
                  <td className="px-6 py-3 text-right text-[#717182]">
                    {row.costUsd !== null ? `$${row.costUsd.toFixed(4)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {data.byFeature.length > 0 && (
        <SectionCard title="By feature">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] text-left text-xs font-medium text-[#717182]">
                <th className="px-6 py-3">Feature</th>
                <th className="px-6 py-3 text-right">Requests</th>
                <th className="px-6 py-3 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {data.byFeature.map((row) => (
                <tr key={row.feature} className="hover:bg-[#f8f9fa]">
                  <td className="px-6 py-3 capitalize text-[#1a1a2e]">
                    {row.feature.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{row.requests}</td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{formatTokens(row.totalTokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </>
  );
}

function AdminUsageSection({ data }: { data: SystemUsageSummary }) {
  return (
    <>
      <div className="flex items-center gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
        <span className="font-semibold">Admin view —</span> system-wide usage across all users
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Activity}
          label="System requests"
          value={String(data.totalRequests)}
          sub={`Last ${data.periodDays} days`}
        />
        <StatCard
          icon={Zap}
          label="System tokens"
          value={formatTokens(data.totalTokens)}
          sub="All users"
        />
        <StatCard
          icon={Coins}
          label="System cost"
          value={data.totalCostUsd !== null ? `$${data.totalCostUsd.toFixed(4)}` : '—'}
          sub="USD"
        />
      </div>

      {data.byModel.length > 0 && (
        <SectionCard title="System usage by model">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] text-left text-xs font-medium text-[#717182]">
                <th className="px-6 py-3">Model</th>
                <th className="px-6 py-3 text-right">Requests</th>
                <th className="px-6 py-3 text-right">Tokens</th>
                <th className="px-6 py-3 text-right">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {data.byModel.map((row) => (
                <tr key={row.model} className="hover:bg-[#f8f9fa]">
                  <td className="px-6 py-3 font-mono text-xs text-[#1a1a2e]">{shortModel(row.model)}</td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{row.requests}</td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{formatTokens(row.totalTokens)}</td>
                  <td className="px-6 py-3 text-right text-[#717182]">
                    {row.costUsd !== null ? `$${row.costUsd.toFixed(4)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {data.topUsers.length > 0 && (
        <SectionCard title="Top 10 users by token consumption">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] text-left text-xs font-medium text-[#717182]">
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3 text-right">Requests</th>
                <th className="px-6 py-3 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {data.topUsers.map((row) => (
                <tr key={row.userId} className="hover:bg-[#f8f9fa]">
                  <td className="px-6 py-3 font-mono text-xs text-[#1a1a2e]">{row.userId}</td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{row.requests}</td>
                  <td className="px-6 py-3 text-right text-[#1a1a2e]">{formatTokens(row.totalTokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </>
  );
}

export default async function UsagePage() {
  const user = await requireUser();
  const isAdmin = user.role === 'system_admin' || user.role === 'support';

  const [userResult, adminResult] = await Promise.allSettled([
    getUserUsageAction(30),
    isAdmin ? getSystemUsageAction(30) : Promise.resolve(null),
  ]);

  const userUsage =
    userResult.status === 'fulfilled' && !('error' in (userResult.value ?? {}))
      ? (userResult.value as UserUsageSummary)
      : null;

  const systemUsage =
    isAdmin &&
    adminResult.status === 'fulfilled' &&
    adminResult.value !== null &&
    !('error' in (adminResult.value ?? {}))
      ? (adminResult.value as SystemUsageSummary)
      : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="AI Usage" />
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#1a1a2e]">AI Usage</h1>
            <p className="mt-1 text-sm text-[#717182]">Last 30 days of AI model usage for your account.</p>
          </div>

          {userUsage ? (
            <UserUsageSection data={userUsage} />
          ) : (
            <div className="rounded-2xl border border-[#e2e8f0] bg-white px-8 py-12 text-center shadow-sm">
              <p className="text-sm text-[#717182]">No usage data yet. Start using the AI features to see stats here.</p>
            </div>
          )}

          {systemUsage && (
            <>
              <div className="my-2 h-px w-full bg-[#e2e8f0]" />
              <AdminUsageSection data={systemUsage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
