'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { regenerateAction } from '../../lib/actions/intelligence.actions';
import { formatPlatformName } from '../../lib/utils';

interface ContentViewerProps {
  platform: string;
  content: Record<string, string>;
  cached: boolean;
}

function formatFieldName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ContentViewer({ platform, content, cached }: ContentViewerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

  function copyField(key: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleRegenerate() {
    setRegenError(null);
    startTransition(async () => {
      const result = await regenerateAction(platform as never);
      if ('error' in result) {
        setRegenError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{formatPlatformName(platform)}</span>
          {cached && <Badge variant="info">Cached</Badge>}
        </div>
        <Button variant="secondary" size="sm" onClick={handleRegenerate} loading={isPending}>
          Regenerate
        </Button>
      </div>

      {regenError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{regenError}</div>
      )}

      {Object.entries(content).map(([key, value]) => (
        <div key={key} className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {formatFieldName(key)}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{value.length} chars</span>
              <button
                onClick={() => copyField(key, value)}
                className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {copied === key ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{value}</p>
        </div>
      ))}
    </div>
  );
}
