import type { DocumentStatus } from '@prezence/types';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getStatusDisplay } from '../../lib/documents/format';

interface DocumentStatusPillProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusPill({ status, className }: DocumentStatusPillProps) {
  const { label, tone } = getStatusDisplay(status);

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-base',
        tone === 'success' && 'text-[#0f6e56]',
        tone === 'processing' && 'text-[#1a1a2e]',
        tone === 'failed' && 'text-[#ff2626]',
        tone === 'pending' && 'text-[#1a1a2e]',
        className,
      )}
    >
      {tone === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />}
      {tone === 'processing' && <Sparkles className="h-4 w-4 shrink-0" aria-hidden />}
      {tone === 'failed' && <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />}
      <span>{label}</span>
    </div>
  );
}
