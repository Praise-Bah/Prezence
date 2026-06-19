import { Skeleton } from '../../../components/ui/skeleton';

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-[10px]" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="mb-2 h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

function PlatformCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-[8px]" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center gap-4 border-b border-[#e2e8f0] bg-white px-5 lg:px-8">
        <Skeleton className="h-5 w-24" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        {/* Greeting */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Quick actions */}
        <div className="mb-8 flex gap-6 border-b border-[#e2e8f0] pb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Platform grid header */}
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Platform grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <PlatformCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
