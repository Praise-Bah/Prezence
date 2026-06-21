'use client';

import type { UserDocument } from '@prezence/types';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { listDocumentsAction } from '../../lib/actions/documents.actions';
import { DOCUMENT_CATEGORIES } from '../../lib/documents/constants';
import { CategoryUploadCard } from '../documents/category-upload-card';
import { DocumentList } from '../documents/document-list';
import { OnboardingStepper } from './onboarding-stepper';

interface OnboardingDocumentsFormProps {
  initialDocuments: UserDocument[];
}

export function OnboardingDocumentsForm({
  initialDocuments,
}: OnboardingDocumentsFormProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);

  const refresh = useCallback(async (): Promise<void> => {
    const next = await listDocumentsAction();
    setDocuments(next);
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-[1328px] flex-col gap-8">
      <OnboardingStepper currentStep={6} />

      <header className="rounded-[15px] border border-[#f8f9fa] bg-white/80 px-4 py-5 shadow-[0px_7px_23px_0px_rgba(0,0,0,0.05)] backdrop-blur-[10px]">
        <h1 className="text-center text-xl font-semibold text-[#1a1a2e]">
          Upload your documents
        </h1>
        <p className="mt-2 text-center text-base font-medium text-[#1a1a2e]">
          CV, certificates, portfolio — the AI reads them all to build richer profiles.
        </p>
        <div className="mt-5 h-4 overflow-hidden rounded-full bg-[rgba(55,113,200,0.04)]">
          <div className="h-full w-full rounded-full bg-[#1d4e8a]" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {DOCUMENT_CATEGORIES.map((config) => (
          <CategoryUploadCard
            key={config.id}
            config={config}
            documents={documents}
            onUploaded={refresh}
          />
        ))}
      </div>

      <DocumentList
        initialDocuments={documents}
        onNeedsRefresh={refresh}
        title="Uploaded files"
        emptyMessage="Upload a document using the category cards above."
        pollWhileProcessing
      />

      <div className="flex items-start gap-6 rounded-[5px] border border-[rgba(0,0,0,0.06)] bg-[#e2e8f0] px-5 py-4">
        <Sparkles className="mt-0.5 h-7 w-7 shrink-0 text-[#3771c8]" aria-hidden />
        <p className="text-base font-medium leading-relaxed text-[#3771c8]">
          The AI extracts your skills, job titles, employers, dates, and certifications
          automatically — you never re-type anything that&apos;s already on your CV. Works for
          any profession: designers, teachers, nurses, tailors, engineers, and more.
        </p>
      </div>

      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded border border-[rgba(0,0,0,0.19)] px-6 py-2.5 text-base font-medium text-[#1a1a2e] transition hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
          Back
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded border border-[rgba(0,0,0,0.19)] px-6 py-2.5 text-base font-medium text-[#1a1a2e] transition hover:bg-white"
        >
          Continue
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      </footer>
    </div>
  );
}
