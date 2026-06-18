'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { SupportedPlatform } from '@prezence/types';
import { regenerateAction } from '../../lib/actions/intelligence.actions';
import { formatPlatformName } from '../../lib/utils';
import { PlatformIcon } from './platform-icon';

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
      const result = await regenerateAction(platform as SupportedPlatform);
      if ('error' in result) {
        setRegenError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const entries = Object.entries(content);

  return (
    <div className="flex flex-col gap-6">
      {/* Header — Review Profiles pattern */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e2e8f0] bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef2ff]">
            <PlatformIcon platform={platform} />
          </div>
          <div>
            <h2 className="text-2xl font-normal text-[#1a1a2e]">
              {formatPlatformName(platform)} profile
            </h2>
            <p className="text-sm text-[rgba(41,45,50,0.44)]">AI-generated content ready to copy</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-[rgba(0,0,0,0.09)] px-4 py-2 text-sm font-medium text-[#1d4e8a]">
            <Sparkles className="h-4 w-4" />
            AI generated
          </span>
          {cached && <Badge variant="info">Cached</Badge>}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRegenerate}
            loading={isPending}
            className="rounded-[10px] border-[rgba(0,0,0,0.19)]"
          >
            Regenerate
          </Button>
        </div>
      </div>

      {regenError && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {regenError}
        </div>
      )}

      {/* Per-field sections — Figma Headline/About blocks */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
        {entries.map(([key, value], index) => (
          <div
            key={key}
            className={index < entries.length - 1 ? 'border-b border-[#e2e8f0]' : undefined}
          >
            <div className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-2xl font-semibold uppercase tracking-normal text-[#1a1a2e]">
                  {formatFieldName(key)}
                </h3>
                <button
                  type="button"
                  onClick={() => copyField(key, value)}
                  className="inline-flex items-center gap-2 rounded-[26px] px-3 py-1.5 text-base font-medium text-[#1d4e8a] transition hover:bg-[#eef2ff]"
                >
                  <Copy className="h-5 w-5" />
                  {copied === key ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-xl font-medium leading-normal text-[#1a1a2e]">
                {value}
              </p>
              <p className="mt-3 text-base font-semibold text-[#717182]">{value.length} chars</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
