import { Skeleton } from '../../../../components/ui/skeleton';

function StepIndicatorSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export default function InterviewLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center gap-4 border-b border-[#e2e8f0] bg-white px-5 lg:px-8">
        <Skeleton className="h-5 w-32" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Step indicators */}
          <div className="mb-8 flex items-center justify-between">
            <StepIndicatorSkeleton />
            <Skeleton className="h-px flex-1 mx-4" />
            <StepIndicatorSkeleton />
            <Skeleton className="h-px flex-1 mx-4" />
            <StepIndicatorSkeleton />
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
            {/* Centered loading indicator */}
            <div className="mb-8 flex flex-col items-center gap-4 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ff]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1d4e8a] border-t-transparent" />
              </div>
              <p className="text-sm font-medium text-[#787c91]">
                Setting up your interview…
              </p>
            </div>

            {/* Form field skeletons */}
            <div className="space-y-5">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
            </div>

            {/* Button row */}
            <div className="mt-8 flex justify-end gap-3">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
