import { Skeleton } from '../../../../components/ui/skeleton';

export default function ContentLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center gap-4 border-b border-[#e2e8f0] bg-white px-5 lg:px-8">
        <Skeleton className="h-5 w-36" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Platform header */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-[10px]" />
            <div>
              <Skeleton className="mb-1 h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-20 rounded-[8px]" />
              <Skeleton className="h-8 w-24 rounded-[8px]" />
            </div>
          </div>

          {/* Content sections */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="mb-4 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm"
            >
              <Skeleton className="mb-3 h-4 w-32" />
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="mb-2 h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
