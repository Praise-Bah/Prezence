import { Skeleton } from '../../../components/ui/skeleton';

function HealthCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-[8px]" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mb-2 h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export default function PlatformsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center border-b border-[#e2e8f0] bg-white px-5 lg:px-8">
        <Skeleton className="h-5 w-24" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        {/* Connect buttons skeleton */}
        <div className="mb-8 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-5 w-40" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-40 rounded-[10px]" />
            <Skeleton className="h-10 w-40 rounded-[10px]" />
          </div>
        </div>

        {/* Health grid */}
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <HealthCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
