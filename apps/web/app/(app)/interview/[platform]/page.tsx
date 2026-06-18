import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '../../../../lib/auth';
import { Topbar } from '../../../../components/layout/topbar';
import { InterviewForm } from '../../../../components/interview/interview-form';
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
    <div>
      <Topbar user={user} title={`${formatPlatformName(platform)} Interview`} />
      <div className="mx-auto max-w-2xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Tell us about yourself</h2>
          <p className="mt-1 text-sm text-gray-500">
            Answer these questions once and our AI will craft the perfect {formatPlatformName(platform)} profile for you.
          </p>
        </div>
        <InterviewForm platform={platform} />
      </div>
    </div>
  );
}
