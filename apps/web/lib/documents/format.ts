import type { DocumentCategory, DocumentStatus, UserDocument } from '@prezence/types';
import { DOCUMENT_CATEGORIES } from './constants';

export function formatFileSize(bytes: number | string): string {
  const size = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!Number.isFinite(size) || size <= 0) return '0 KB';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDocumentIconTint(
  doc: Pick<UserDocument, 'mimeType' | 'category'>,
): string {
  if (doc.category) {
    const config = DOCUMENT_CATEGORIES.find((c) => c.id === doc.category);
    if (config) return config.iconTint;
  }
  if (doc.mimeType === 'application/pdf') return '#ffcece';
  if (doc.mimeType.startsWith('image/')) return '#d0ffe2';
  return '#a1cbff';
}

export function getStatusDisplay(status: DocumentStatus): {
  label: string;
  tone: 'processing' | 'success' | 'failed' | 'pending';
} {
  switch (status) {
    case 'extracting':
    case 'pending':
      return { label: 'AI reading.....', tone: 'processing' };
    case 'done':
      return { label: 'Extracted', tone: 'success' };
    case 'failed':
      return { label: 'Failed', tone: 'failed' };
    default:
      return { label: 'AI reading.....', tone: 'processing' };
  }
}

export function countByCategory(
  documents: UserDocument[],
  category: DocumentCategory,
): number {
  return documents.filter((doc) => doc.category === category).length;
}
