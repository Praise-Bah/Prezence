export default function UsageLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <div className="flex h-[71px] shrink-0 items-center border-b border-[#e2e8f0] bg-white px-6">
        <div className="h-5 w-24 animate-pulse rounded-md bg-[#e2e8f0]" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-8 w-40 animate-pulse rounded-md bg-[#e2e8f0]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#e2e8f0]" />
            ))}
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-[#e2e8f0]" />
          <div className="h-40 animate-pulse rounded-2xl bg-[#e2e8f0]" />
        </div>
      </div>
    </div>
  );
}
