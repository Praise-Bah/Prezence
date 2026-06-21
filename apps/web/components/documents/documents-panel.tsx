'use client';

import type { UserDocument } from '@prezence/types';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { listDocumentsAction } from '../../lib/actions/documents.actions';
import { DocumentList } from './document-list';
import { DocumentUploadZone } from './document-upload-zone';

interface DocumentsPanelProps {
  initialDocuments: UserDocument[];
}

export function DocumentsPanel({ initialDocuments }: DocumentsPanelProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);

  const refresh = useCallback(async (): Promise<void> => {
    const next = await listDocumentsAction();
    setDocuments(next);
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <DocumentUploadZone onUploaded={refresh} />

      <DocumentList
        initialDocuments={documents}
        onNeedsRefresh={refresh}
        title="Uploaded files"
        emptyMessage="No documents yet. Upload a CV, certificate, or portfolio file above."
        pollWhileProcessing
      />

      <div className="flex items-start gap-4 rounded-[5px] border border-[rgba(0,0,0,0.06)] bg-[#e2e8f0] px-5 py-4">
        <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-[#3771c8]" aria-hidden />
        <p className="text-sm font-medium leading-relaxed text-[#3771c8]">
          The AI extracts skills, job titles, employers, and certifications from your uploads
          automatically — no re-typing required.
        </p>
      </div>
    </div>
  );
}
