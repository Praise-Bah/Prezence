'use client';

import type { DocumentCategory, UserDocument } from '@prezence/types';
import { Loader2 } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { uploadDocumentAction } from '../../lib/actions/documents.actions';
import type { DocumentCategoryConfig } from '../../lib/documents/constants';
import { countByCategory } from '../../lib/documents/format';
import { cn } from '../../lib/utils';

interface CategoryUploadCardProps {
  config: DocumentCategoryConfig;
  documents: UserDocument[];
  onUploaded?: () => void;
}

function getBadge(
  config: DocumentCategoryConfig,
  uploadedCount: number,
): { label: string; className: string } {
  if (uploadedCount > 0) {
    return {
      label: `${uploadedCount} uploaded`,
      className: 'bg-[#eef2ff] text-[#1a1a2e]',
    };
  }
  if (config.required) {
    return {
      label: 'Required',
      className: 'bg-[#ffe6e6] text-[#ff2626]',
    };
  }
  return {
    label: 'Optional',
    className: 'bg-[rgba(213,194,22,0.24)] text-[#1a1a2e]',
  };
}

export function CategoryUploadCard({
  config,
  documents,
  onUploaded,
}: CategoryUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const uploadedCount = countByCategory(documents, config.id as DocumentCategory);
  const badge = getBadge(config, uploadedCount);
  const Icon = config.icon;
  const atLimit = config.maxFiles !== undefined && uploadedCount >= config.maxFiles;

  const uploadFile = (file: File): void => {
    if (atLimit) {
      setError(`Maximum of ${config.maxFiles} files for this category.`);
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', config.id);

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
    <div className="flex flex-col">
      <div
        role="button"
        tabIndex={atLimit ? -1 : 0}
        aria-disabled={atLimit || isPending}
        onKeyDown={(e) => {
          if (atLimit) return;
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          if (atLimit) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (atLimit) return;
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!atLimit) inputRef.current?.click();
        }}
        className={cn(
          'flex h-[246px] w-full flex-col items-center justify-center rounded-[5px] border border-dashed border-[rgba(0,0,0,0.23)] bg-[#efefef] px-4 transition',
          !atLimit && 'cursor-pointer hover:border-[#1d4e8a] hover:bg-[#e8e8e8]',
          isDragging && 'border-[#1d4e8a] bg-[#e2e8f0]',
          (atLimit || isPending) && 'cursor-not-allowed opacity-80',
        )}
      >
        <div className="flex flex-col items-center gap-[11px]">
          <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[5px] border border-[rgba(26,26,46,0.68)] p-2">
            {isPending ? (
              <Loader2 className="h-[34px] w-[34px] animate-spin text-[#1a1a2e]" aria-hidden />
            ) : (
              <Icon className="h-[34px] w-[34px] text-[#1a1a2e]" aria-hidden />
            )}
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-base font-medium text-[#1a1a2e]">{config.label}</p>
            <p className="text-xs text-[#1a1a2e]">{config.hint}</p>
            <span
              className={cn(
                'mt-2 inline-flex h-[29px] items-center rounded-lg px-[10px] text-xs',
                badge.className,
              )}
            >
              {badge.label}
            </span>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={config.accept}
          disabled={atLimit || isPending}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <p className="mt-2 text-center text-xs text-[#ff2626]">{error}</p>
      )}
    </div>
  );
}
