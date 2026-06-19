import { Skeleton } from '../../../components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center border-b border-[#e2e8f0] px-5 lg:px-8">
        <Skeleton className="h-5 w-20" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Profile header */}
          <div className="flex items-center gap-5">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div>
              <Skeleton className="mb-2 h-6 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>

          {/* Form fields */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <Skeleton className="mb-6 h-5 w-32" />
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-1.5 h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-[10px]" />
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Skeleton className="mb-1.5 h-3 w-20" />
              <Skeleton className="h-24 w-full rounded-[10px]" />
            </div>
            <div className="mt-6 flex justify-end">
              <Skeleton className="h-10 w-28 rounded-[10px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
