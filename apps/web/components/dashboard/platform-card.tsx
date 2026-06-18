import Link from 'next/link';
import { Badge } from '../ui/badge';
import { formatPlatformName, getPlatformIcon } from '../../lib/utils';

interface PlatformCardProps {
  platform: string;
  hasContent: boolean;
  qualityScore: number | null;
  marketScore: number | null;
  cached: boolean;
}

function getQualityVariant(score: number | null): 'success' | 'warning' | 'error' | 'default' {
  if (score === null) return 'default';
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
}

function getStatusLabel(hasContent: boolean, qualityScore: number | null): {
  label: string;
  dot: string;
} {
  if (!hasContent) return { label: 'Not started', dot: 'bg-[#787c91]' };
  if (qualityScore !== null && qualityScore < 60) return { label: 'Needs attention', dot: 'bg-[#f97316]' };
  if (qualityScore !== null && qualityScore < 40) return { label: 'Error', dot: 'bg-[#ef4444]' };
  return { label: 'Live', dot: 'bg-[#22c55e]' };
}

export function PlatformCard({
  platform,
  hasContent,
  qualityScore,
  marketScore,
  cached,
}: PlatformCardProps) {
  const score = marketScore ?? qualityScore;
  const progress = score ?? 0;
  const status = getStatusLabel(hasContent, qualityScore);

  return (
    <div className="flex flex-col rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{getPlatformIcon(platform)}</span>
          <span className="font-semibold text-[#1a1a2e]">{formatPlatformName(platform)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cnDot(status.dot)} />
          <span className="text-sm text-[#787c91]">{status.label}</span>
        </div>
      </div>

      {hasContent ? (
        <>
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-[#787c91]">
              <span>Score</span>
              <span className="font-medium text-[#1a1a2e]">
                {score !== null ? `${Math.round(score)}%` : '—'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
              <div
                className="h-full rounded-full bg-[#1d4e8a] transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {qualityScore !== null && (
              <Badge variant={getQualityVariant(qualityScore)}>Quality {qualityScore}</Badge>
            )}
            {marketScore !== null && (
              <Badge variant={getQualityVariant(marketScore)}>Market {marketScore}</Badge>
            )}
            {cached && <Badge variant="info">Cached</Badge>}
          </div>
        </>
      ) : (
        <p className="mb-4 text-sm leading-relaxed text-[#787c91]">
          Answer the interview questions to generate your {formatPlatformName(platform)} profile.
        </p>
      )}

      <div className="mt-auto flex gap-2">
        {hasContent ? (
          <>
            <Link
              href={`/content/${platform}`}
              className="flex-1 rounded-full bg-[#1d4e8a] px-3 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#163d6e]"
            >
              View profile
            </Link>
            <Link
              href={`/interview/${platform}`}
              className="flex-1 rounded-full border border-[#e2e8f0] px-3 py-2.5 text-center text-sm font-medium text-[#1a1a2e] transition hover:bg-[#f8f9fa]"
            >
              Regenerate
            </Link>
          </>
        ) : (
          <Link
            href={`/interview/${platform}`}
            className="w-full rounded-full bg-[#1d4e8a] px-3 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#163d6e]"
          >
            Start interview →
          </Link>
        )}
      </div>
    </div>
  );
}

function cnDot(colorClass: string): string {
  return `inline-block h-3.5 w-3.5 shrink-0 rounded-full ${colorClass}`;
}
