'use client';

import type { DocumentCategory } from '@prezence/types';
import { Upload } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { uploadDocumentAction } from '../../lib/actions/documents.actions';
import { cn } from '../../lib/utils';

interface DocumentUploadZoneProps {
  category?: DocumentCategory;
  onUploaded?: () => void;
  className?: string;
}

export function DocumentUploadZone({
  category,
  onUploaded,
  className,
}: DocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadFile = (file: File): void => {
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);

    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      onUploaded?.();
    });
  };

  const handleFiles = (files: FileList | null): void => {
    const file = files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-8 py-8 transition',
          isDragging
            ? 'border-[#1d4e8a] bg-[#f5f5ff]'
            : 'border-[#ededed] bg-white hover:border-[#1d4e8a] hover:bg-[#f5f5ff]',
          isPending && 'pointer-events-none opacity-70',
        )}
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white bg-white shadow-[0px_1px_1px_rgba(16,24,40,0.05)]">
          <Upload className="h-6 w-6 text-[#1a1a2e]" aria-hidden />
        </div>
        <p className="text-sm font-medium text-[#1a1a2e]">
          Choose a file or drag &amp; drop it here.
        </p>
        <p className="mt-1 text-center text-xs text-[#878787]">
          PDF, DOCX, JPEG, PNG, and WebP formats, up to 20 MB.
        </p>
        <span className="mt-4 rounded border border-[#ededed] bg-white px-3 py-2 text-xs font-medium text-[#383838]">
          {isPending ? 'Uploading…' : 'Browse File'}
        </span>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <p className="mt-3 rounded-[5px] border border-[#f14141] bg-[#fff5f5] px-4 py-2 text-sm text-[#d93a3a]">
          {error}
        </p>
      )}
    </div>
  );
}
