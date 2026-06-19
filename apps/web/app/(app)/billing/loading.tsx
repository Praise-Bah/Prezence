import { Skeleton } from '../../../components/ui/skeleton';

function PlanCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
      <Skeleton className="mb-2 h-5 w-24" />
      <Skeleton className="mb-1 h-8 w-32" />
      <Skeleton className="mb-6 h-4 w-28" />
      <div className="space-y-3 mb-6">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function BillingLoading() {
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
        {/* Heading */}
        <div className="mb-8">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <PlanCardSkeleton />
          <PlanCardSkeleton />
          <PlanCardSkeleton />
        </div>
      </div>
    </div>
  );
}
