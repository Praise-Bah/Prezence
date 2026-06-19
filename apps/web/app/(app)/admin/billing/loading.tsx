export default function AdminBillingLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <div className="h-[71px] shrink-0 animate-pulse bg-white border-b border-[#e2e8f0]" />
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-[#e2e8f0]" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-white border border-[#e2e8f0]" />
          ))}
        </div>
      </div>
    </div>
  );
}
