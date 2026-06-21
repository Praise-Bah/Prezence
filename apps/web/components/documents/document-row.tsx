'use client';

import type { UserDocument } from '@prezence/types';
import { FileText, Loader2, ScrollText, X } from 'lucide-react';
import { useTransition } from 'react';
import { deleteDocumentAction } from '../../lib/actions/documents.actions';
import { formatFileSize, getDocumentIconTint } from '../../lib/documents/format';
import { cn } from '../../lib/utils';
import { DocumentStatusPill } from './document-status-pill';

interface DocumentRowProps {
  document: UserDocument;
  onDeleted?: () => void;
  compact?: boolean;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return <FileText className="h-[34px] w-[34px] text-[#1a1a2e]" aria-hidden />;
  }
  return <ScrollText className="h-[34px] w-[34px] text-[#1a1a2e]" aria-hidden />;
}

export function DocumentRow({ document, onDeleted, compact }: DocumentRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (): void => {
    startTransition(async () => {
      const result = await deleteDocumentAction(document.id);
      if ('success' in result) onDeleted?.();
    });
  };

  const iconTint = getDocumentIconTint(document);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-[5px] border border-[#c6c6c8] bg-[rgba(0,0,0,0.02)] px-[19px]',
        compact ? 'min-h-[72px] py-3' : 'h-[84px]',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-7">
        <div
          className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[5px] p-2"
          style={{ backgroundColor: iconTint }}
        >
          <FileTypeIcon mimeType={document.mimeType} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-medium text-[#1a1a2e]">{document.filename}</p>
          <p className="mt-0.5 text-base text-[#1a1a2e]">{formatFileSize(document.fileSize)}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <DocumentStatusPill status={document.status} />
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded p-1 text-[#787c91] transition hover:bg-[rgba(0,0,0,0.05)] hover:text-[#1a1a2e] disabled:opacity-50"
          aria-label={`Remove ${document.filename}`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <X className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
