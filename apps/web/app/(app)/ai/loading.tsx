import { Skeleton } from '../../../components/ui/skeleton';

function ChatBubbleSkeleton({ align }: { align: 'left' | 'right' }) {
  const isRight = align === 'right';
  return (
    <div className={`flex gap-3 ${isRight ? 'flex-row-reverse' : ''}`}>
      {!isRight && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
      <div className={`max-w-[70%] ${isRight ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <Skeleton className={`h-16 w-64 rounded-2xl`} />
      </div>
    </div>
  );
}

export default function AiLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      {/* Topbar skeleton */}
      <div className="flex h-16 items-center border-b border-[#e2e8f0] bg-white px-5 lg:px-8">
        <Skeleton className="h-5 w-28" />
        <div className="ml-auto">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <ChatBubbleSkeleton align="left" />
          <ChatBubbleSkeleton align="right" />
          <ChatBubbleSkeleton align="left" />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-[#e2e8f0] bg-white px-5 py-4 lg:px-8">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Skeleton className="h-12 flex-1 rounded-[12px]" />
          <Skeleton className="h-12 w-12 rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}
