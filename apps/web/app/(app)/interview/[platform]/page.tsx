import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '../../../../lib/auth';
import { Topbar } from '../../../../components/layout/topbar';
import { InterviewForm } from '../../../../components/interview/interview-form';
import { PlatformIcon } from '../../../../components/content/platform-icon';
import { formatPlatformName } from '../../../../lib/utils';

const SUPPORTED_PLATFORMS = [
  'linkedin', 'github', 'instagram', 'facebook',
  'fiverr', 'freelancer', 'tiktok', 'twitter',
] as const;

type Params = Promise<{ platform: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { platform } = await params;
  return { title: `Interview — ${formatPlatformName(platform)}` };
}

export default async function InterviewPage({ params }: { params: Params }) {
  const { platform } = await params;

  if (!SUPPORTED_PLATFORMS.includes(platform as (typeof SUPPORTED_PLATFORMS)[number])) {
    notFound();
  }

  const user = await requireUser();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Generate content" />
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-4">
            <PlatformIcon platform={platform} />
            <div>
              <h2 className="text-2xl font-medium text-[#1a1a2e]">
                {formatPlatformName(platform)} interview
              </h2>
              <p className="mt-1 text-sm text-[#717182]">
                Create AI-powered content for your {formatPlatformName(platform)} profile
              </p>
            </div>
          </div>
          <InterviewForm platform={platform} />
        </div>
      </div>
    </div>
  );
}
