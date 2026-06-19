'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CalendarClock, Copy, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { SupportedPlatform, SubscriptionPlan } from '@prezence/types';
import { regenerateAction } from '../../lib/actions/intelligence.actions';
import { cancelScheduledPostAction } from '../../lib/actions/content.actions';
import type { ScheduledPost } from '../../lib/actions/content.actions';
import { formatPlatformName } from '../../lib/utils';
import { PlatformIcon } from './platform-icon';
import { SchedulePostModal } from './schedule-post-modal';

interface ContentViewerProps {
  platform: string;
  content: Record<string, string>;
  cached: boolean;
  userPlan: SubscriptionPlan;
  initialScheduledPosts: ScheduledPost[];
}

function formatFieldName(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatScheduledAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-[#f1f5f9] text-[#717182] border-[#e2e8f0]',
};

export function ContentViewer({
  platform,
  content,
  cached,
  userPlan,
  initialScheduledPosts,
}: ContentViewerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCancelling, startCancelTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(initialScheduledPosts);

  const canSchedule = userPlan === 'professional' || userPlan === 'elite';
  const activeScheduled = scheduledPosts.filter((p) => p.status === 'scheduled' || p.status === 'processing');

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

  function handleScheduled(post: ScheduledPost) {
    setScheduledPosts((prev) => [post, ...prev]);
  }

  function handleCancel(postId: string) {
    startCancelTransition(async () => {
      const result = await cancelScheduledPostAction(postId);
      if ('error' in result) return;
      setScheduledPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: 'cancelled' as const } : p)),
      );
    });
  }

  const entries = Object.entries(content);

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
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
            {canSchedule && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowScheduleModal(true)}
                className="rounded-[10px] border-[rgba(0,0,0,0.19)]"
              >
                <CalendarClock className="mr-1.5 h-4 w-4" />
                Schedule
              </Button>
            )}
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

        {/* Scheduled posts for this platform */}
        {activeScheduled.length > 0 && (
          <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-6 py-4">
              <Calendar className="h-4 w-4 text-[#1d4e8a]" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Scheduled posts</h3>
            </div>
            <ul className="divide-y divide-[#f1f5f9]">
              {activeScheduled.map((post) => (
                <li key={post.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1a1a2e]">
                      {formatScheduledAt(post.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[post.status] ?? ''}`}
                    >
                      {post.status}
                    </span>
                    {post.status === 'scheduled' && (
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={() => handleCancel(post.id)}
                        className="rounded-lg p-1 text-[#717182] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        title="Cancel scheduled post"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Per-field sections */}
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

      {showScheduleModal && (
        <SchedulePostModal
          platform={platform as SupportedPlatform}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={handleScheduled}
        />
      )}
    </>
  );
}
