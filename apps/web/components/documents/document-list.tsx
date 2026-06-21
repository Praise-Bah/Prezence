'use client';

import type { UserDocument } from '@prezence/types';
import { useEffect } from 'react';
import { DocumentRow } from './document-row';

interface DocumentListProps {
  initialDocuments: UserDocument[];
  onNeedsRefresh?: () => void;
  title?: string;
  emptyMessage?: string;
  pollWhileProcessing?: boolean;
}

function hasProcessing(documents: UserDocument[]): boolean {
  return documents.some(
    (doc) => doc.status === 'pending' || doc.status === 'extracting',
  );
}

export function DocumentList({
  initialDocuments,
  onNeedsRefresh,
  title = 'Uploaded files',
  emptyMessage = 'No files uploaded yet.',
  pollWhileProcessing = true,
}: DocumentListProps) {
  useEffect(() => {
    if (!pollWhileProcessing || !hasProcessing(initialDocuments)) return;

    const timer = window.setInterval(() => {
      void onNeedsRefresh?.();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [initialDocuments, pollWhileProcessing, onNeedsRefresh]);

  return (
    <section className="w-full">
      <h2 className="mb-6 text-xl font-semibold text-[#1a1a2e]">{title}</h2>

      {initialDocuments.length === 0 ? (
        <p className="rounded-[5px] border border-dashed border-[rgba(0,0,0,0.23)] bg-[#efefef] px-6 py-10 text-center text-base text-[#787c91]">
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {initialDocuments.map((doc) => (
            <DocumentRow key={doc.id} document={doc} onDeleted={onNeedsRefresh} />
          ))}
        </div>
      )}
    </section>
  );
}
