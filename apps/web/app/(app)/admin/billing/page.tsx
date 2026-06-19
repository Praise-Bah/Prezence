import type { Metadata } from 'next';
import { requireUser } from '../../../../lib/auth';
import { listPendingRequestsAction } from '../../../../lib/actions/admin.actions';
import { Topbar } from '../../../../components/layout/topbar';
import { PendingQueue } from '../../../../components/admin/pending-queue';

export const metadata: Metadata = { title: 'Admin — Payment Queue' };

export default async function AdminBillingPage() {
  const user = await requireUser();
  const result = await listPendingRequestsAction();
  const requests = 'error' in result ? [] : result;
  const fetchError = 'error' in result ? result.error : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Payment Queue" />
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#1a1a2e]">Payment Queue</h2>
          <p className="mt-1 text-sm text-[#888780]">
            {fetchError
              ? fetchError
              : `${requests.length} submission${requests.length !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>
        <PendingQueue requests={requests} />
      </div>
    </div>
  );
}
