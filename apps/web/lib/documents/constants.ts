import type { DocumentCategory } from '@prezence/types';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  FileText,
  Image,
  PenLine,
  Plus,
  ScrollText,
} from 'lucide-react';

export interface DocumentCategoryConfig {
  id: DocumentCategory;
  label: string;
  hint: string;
  required: boolean;
  maxFiles?: number;
  accept: string;
  icon: LucideIcon;
  iconTint: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategoryConfig[] = [
  {
    id: 'cv',
    label: 'CV/Resume',
    hint: 'PDF or Word',
    required: true,
    accept: '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: FileText,
    iconTint: '#ffcece',
  },
  {
    id: 'certification',
    label: 'Certification',
    hint: 'Up to 5 files',
    required: false,
    maxFiles: 5,
    accept: '.pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp',
    icon: ScrollText,
    iconTint: '#a1cbff',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    hint: 'Images or PDF',
    required: true,
    accept: '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp',
    icon: Image,
    iconTint: '#d0ffe2',
  },
  {
    id: 'reference_letters',
    label: 'Reference letters',
    hint: 'PDF or image',
    required: false,
    accept: '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp',
    icon: PenLine,
    iconTint: '#eef2ff',
  },
  {
    id: 'awards',
    label: 'Awards',
    hint: 'Any proof',
    required: false,
    accept: '.pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp',
    icon: Award,
    iconTint: '#d0ffe2',
  },
  {
    id: 'other',
    label: 'Other',
    hint: 'Any relevant doc',
    required: false,
    accept: '.pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp',
    icon: Plus,
    iconTint: '#efefef',
  },
];

export const ONBOARDING_STEPS = [
  { id: 1, label: 'Create account' },
  { id: 2, label: 'Choose plan' },
  { id: 3, label: 'Verify email' },
  { id: 4, label: 'Verify Identity' },
  { id: 5, label: 'Intro Video' },
  { id: 6, label: 'Documents' },
] as const;
