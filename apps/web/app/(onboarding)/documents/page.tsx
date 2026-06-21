import type { Metadata } from 'next';
import type { UserDocument } from '@prezence/types';
import { api } from '../../../lib/api';
import { OnboardingDocumentsForm } from '../../../components/onboarding/onboarding-documents-form';

export const metadata: Metadata = { title: 'Upload documents — Onboarding' };

async function fetchDocuments(): Promise<UserDocument[]> {
  try {
    return await api.get<UserDocument[]>('/documents');
  } catch {
    return [];
  }
}

export default async function OnboardingDocumentsPage() {
  const documents = await fetchDocuments();

  return <OnboardingDocumentsForm initialDocuments={documents} />;
}
