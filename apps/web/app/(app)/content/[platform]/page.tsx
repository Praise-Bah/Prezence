import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { requireUser } from '../../../../lib/auth';
import { api, ApiError } from '../../../../lib/api';
import { getScheduledPostsAction } from '../../../../lib/actions/content.actions';
import type { ScheduledPost } from '../../../../lib/actions/content.actions';
import { Topbar } from '../../../../components/layout/topbar';
import { ContentViewer } from '../../../../components/content/content-viewer';
import { PlatformIcon } from '../../../../components/content/platform-icon';
import { formatPlatformName } from '../../../../lib/utils';
import type { SupportedPlatform } from '@prezence/types';

const SUPPORTED_PLATFORMS = [
  'linkedin', 'github', 'instagram', 'facebook',
  'fiverr', 'freelancer', 'tiktok', 'twitter',
] as const;

type Params = Promise<{ platform: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { platform } = await params;
  return { title: `${formatPlatformName(platform)} Profile` };
}

export default async function ContentPage({ params }: { params: Params }) {
  const { platform } = await params;

  if (!SUPPORTED_PLATFORMS.includes(platform as (typeof SUPPORTED_PLATFORMS)[number])) {
    notFound();
  }

  const user = await requireUser();

  let content: Record<string, string> | null = null;
  let cached = false;
  let isNotFound = false;
  let scheduledPosts: ScheduledPost[] = [];

  const [contentResult, scheduleResult] = await Promise.allSettled([
    api.get<{ content: Record<string, string>; cached: boolean }>(`/content/${platform}`),
    getScheduledPostsAction(),
  ]);

  if (contentResult.status === 'fulfilled') {
    content = contentResult.value.content;
    cached = contentResult.value.cached;
  } else {
    const err = contentResult.reason as unknown;
    if (err instanceof ApiError && err.status === 404) {
      isNotFound = true;
    } else {
      throw err;
    }
  }

  if (scheduleResult.status === 'fulfilled' && !('error' in scheduleResult.value)) {
    scheduledPosts = (scheduleResult.value as ScheduledPost[]).filter(
      (p) => p.platform === (platform as SupportedPlatform),
    );
  }

  const title = `${formatPlatformName(platform)} Profile`;

  if (isNotFound || !content) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
        <Topbar user={user} title={title} />
        <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-dashed border-[#cdd5e9] bg-white px-8 py-16 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#ececf0]">
                <PlatformIcon platform={platform} />
              </div>
              <h2 className="text-xl font-medium text-[#1a1a2e]">No profile yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#717182]">
                No {formatPlatformName(platform)} profile yet. Complete the interview to generate
                one.
              </p>
              <Link
                href={`/interview/${platform}`}
                className="mt-8 inline-flex items-center gap-2 rounded-[10px] bg-[#1a1a2e] px-6 py-3 text-sm font-medium text-[#f8f9fa] transition hover:bg-[#2a2a3e]"
              >
                <Sparkles className="h-4 w-4" />
                Start interview
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title={title} />
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <ContentViewer
            platform={platform}
            content={content}
            cached={cached}
            userPlan={user.plan}
            initialScheduledPosts={scheduledPosts}
          />
        </div>
      </div>
    </div>
  );
}
