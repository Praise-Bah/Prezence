import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '../../../../lib/auth';
import { api, ApiError } from '../../../../lib/api';
import { Topbar } from '../../../../components/layout/topbar';
import { ContentViewer } from '../../../../components/content/content-viewer';
import { formatPlatformName } from '../../../../lib/utils';

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

  try {
    const data = await api.get<{ content: Record<string, string>; cached: boolean }>(
      `/content/${platform}`,
    );
    content = data.content;
    cached = data.cached;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      isNotFound = true;
    } else {
      throw err;
    }
  }

  const title = `${formatPlatformName(platform)} Profile`;

  if (isNotFound || !content) {
    return (
      <div>
        <Topbar user={user} title={title} />
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="mb-4 text-gray-600">
              No {formatPlatformName(platform)} profile yet. Complete the interview to generate one.
            </p>
            <Link
              href={`/interview/${platform}`}
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Start interview &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar user={user} title={title} />
      <div className="mx-auto max-w-2xl p-6">
        <ContentViewer platform={platform} content={content} cached={cached} />
      </div>
    </div>
  );
}
