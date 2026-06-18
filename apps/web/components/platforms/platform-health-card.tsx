import { PlatformIcon } from '../content/platform-icon';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatRelativeTime } from '../../lib/format-relative-time';
import { formatPlatformName } from '../../lib/utils';

export type DisplayHealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface PlatformHealthCheck {
  id: string;
  platform: string;
  status: DisplayHealthStatus;
  last_checked_at: string | null;
  response_time_ms: number | null;
  error_message: string | null;
}

const STATUS_META: Record<
  DisplayHealthStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'default'; dot: string }
> = {
  healthy: { label: 'Healthy', variant: 'success', dot: 'bg-[#22c55e]' },
  degraded: { label: 'Degraded', variant: 'warning', dot: 'bg-[#f59e0b]' },
  down: { label: 'Down', variant: 'error', dot: 'bg-[#ef4444]' },
  unknown: { label: 'Unknown', variant: 'default', dot: 'bg-[#787c91]' },
};

interface PlatformHealthCardProps {
  check: PlatformHealthCheck;
}

export function PlatformHealthCard({ check }: PlatformHealthCardProps) {
  const meta = STATUS_META[check.status];

  return (
    <div className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f8f9fa]">
            <PlatformIcon platform={check.platform} />
          </div>
          <div>
            <p className="font-semibold text-[#1a1a2e]">{formatPlatformName(check.platform)}</p>
            <p className="text-xs text-[#787c91]">Connection health</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${meta.dot}`} />
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
      </div>

      <dl className="mb-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[#787c91]">Last checked</dt>
          <dd className="font-medium text-[#1a1a2e]">
            {formatRelativeTime(check.last_checked_at)}
          </dd>
        </div>
        {check.response_time_ms !== null && (
          <div className="flex items-center justify-between gap-4">
            <dt className="text-[#787c91]">Response time</dt>
            <dd className="font-medium text-[#1a1a2e]">{check.response_time_ms} ms</dd>
          </div>
        )}
      </dl>

      {check.error_message && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {check.error_message}
        </p>
      )}

      <Button variant="secondary" size="sm" disabled className="mt-auto w-full rounded-full">
        Check now
      </Button>
    </div>
  );
}

export function normalizeHealthStatus(status: string): DisplayHealthStatus {
  switch (status) {
    case 'healthy':
      return 'healthy';
    case 'degraded':
      return 'degraded';
    case 'unreachable':
    case 'token_expired':
    case 'down':
      return 'down';
    default:
      return 'unknown';
  }
}

interface ApiPlatformHealthSummary {
  platform: string;
  status: string;
  responseMs?: number | null;
  response_ms?: number | null;
  checkedAt?: string | null;
  checked_at?: string | null;
  last_checked_at?: string | null;
  errorMessage?: string | null;
  error_message?: string | null;
  id?: string;
}

export function mapApiHealthCheck(raw: ApiPlatformHealthSummary, index: number): PlatformHealthCheck {
  const lastChecked =
    raw.checkedAt ?? raw.checked_at ?? raw.last_checked_at ?? null;
  const responseMs = raw.responseMs ?? raw.response_ms ?? null;
  const errorMessage = raw.errorMessage ?? raw.error_message ?? null;

  return {
    id: raw.id ?? `${raw.platform}-${index}`,
    platform: raw.platform,
    status: normalizeHealthStatus(raw.status),
    last_checked_at: lastChecked,
    response_time_ms: responseMs,
    error_message: errorMessage,
  };
}
