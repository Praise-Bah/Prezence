import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '../../../lib/auth';
import { Topbar } from '../../../components/layout/topbar';
import { Card, CardContent } from '../../../components/ui/card';

export const metadata: Metadata = { title: 'Documents' };

export default async function DocumentsPage() {
  const user = await requireUser();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Documents" />

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-6 lg:px-8">
        <div className="mb-8 w-full max-w-3xl">
          <h1 className="text-[28px] font-medium leading-[42px] text-[#1a1a2e]">Documents</h1>
          <p className="mt-1 text-base text-[#888780]">
            Upload CVs, certificates, and portfolio files for richer AI profiles.
          </p>
        </div>

        <Card className="w-full max-w-md border-[#e2e8f0] text-center shadow-sm">
          <CardContent className="px-8 py-12">
            <p className="text-base text-[#787c91]">Document management coming soon.</p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block text-sm font-medium text-[#1d4e8a] hover:underline"
            >
              ← Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
