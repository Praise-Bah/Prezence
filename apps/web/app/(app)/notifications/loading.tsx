import { Skeleton } from '../../../components/ui/skeleton';

function NotificationRowSkeleton() {
  return (
    <div className="flex gap-4 border-b border-[#e2e8f0] px-5 py-4">
      <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
      <div className="flex-1">
        <Skeleton className="mb-1.5 h-4 w-48" />
        <Skeleton className="mb-1 h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-3 w-16 shrink-0" />
    </div>
  );
}

export default function NotificationsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center border-b border-[#e2e8f0] bg-white px-5 lg:px-8">
        <Skeleton className="h-5 w-32" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-[#e2e8f0] px-5 pt-4">
            <Skeleton className="mb-3 h-4 w-16" />
            <Skeleton className="mb-3 h-4 w-20" />
          </div>

          {/* Rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
