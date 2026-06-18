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

export function PlatformCard({
  platform,
  hasContent,
  qualityScore,
  marketScore,
  cached,
}: PlatformCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getPlatformIcon(platform)}</span>
          <span className="font-semibold text-gray-900">{formatPlatformName(platform)}</span>
        </div>
        {hasContent ? (
          <Badge variant="success">Ready</Badge>
        ) : (
          <Badge variant="default">Not started</Badge>
        )}
      </div>

      {hasContent ? (
        <div className="flex gap-3 mb-4">
          {qualityScore !== null && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Quality</span>
              <div className="flex items-center gap-1">
                <Badge variant={getQualityVariant(qualityScore)}>{qualityScore}/100</Badge>
              </div>
            </div>
          )}
          {marketScore !== null && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400">Market fit</span>
              <Badge variant={getQualityVariant(marketScore)}>{marketScore}/100</Badge>
            </div>
          )}
          {cached && <Badge variant="info" className="self-end">Cached</Badge>}
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-500">
          Answer the interview questions to generate your {formatPlatformName(platform)} profile.
        </p>
      )}

      <div className="mt-auto flex gap-2">
        {hasContent ? (
          <>
            <Link
              href={`/content/${platform}`}
              className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
            >
              View profile
            </Link>
            <Link
              href={`/interview/${platform}`}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Regenerate
            </Link>
          </>
        ) : (
          <Link
            href={`/interview/${platform}`}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
          >
            Start interview →
          </Link>
        )}
      </div>
    </div>
  );
}
