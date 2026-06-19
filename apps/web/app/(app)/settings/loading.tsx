import { Skeleton } from '../../../components/ui/skeleton';

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className={`h-10 rounded-lg ${wide ? 'w-full' : 'w-full max-w-sm'}`} />
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center gap-4 border-b border-[#e2e8f0] bg-white px-5 lg:px-8">
        <Skeleton className="h-5 w-20" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Heading */}
          <div className="mb-8">
            <Skeleton className="mb-2 h-8 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Profile section */}
          <div className="mb-6 rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <Skeleton className="mb-6 h-5 w-32" />
            <div className="space-y-5">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton wide />
            </div>
            <div className="mt-6 flex justify-end">
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>

          {/* Password section */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <Skeleton className="mb-6 h-5 w-40" />
            <div className="space-y-5">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
            <div className="mt-6 flex justify-end">
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
