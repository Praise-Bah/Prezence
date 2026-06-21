import type { Metadata } from 'next';
import type { UserDocument } from '@prezence/types';
import { requireUser } from '../../../lib/auth';
import { api } from '../../../lib/api';
import { Topbar } from '../../../components/layout/topbar';
import { DocumentsPanel } from '../../../components/documents/documents-panel';

export const metadata: Metadata = { title: 'Documents' };

async function fetchDocuments(): Promise<UserDocument[]> {
  try {
    return await api.get<UserDocument[]>('/documents');
  } catch {
    return [];
  }
}

export default async function DocumentsPage() {
  const user = await requireUser();
  const documents = await fetchDocuments();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Documents" />

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-[28px] font-medium leading-[42px] text-[#1a1a2e]">Documents</h1>
          <p className="mt-1 text-base text-[#888780]">
            Upload CVs, certificates, and portfolio files for richer AI profiles.
          </p>
        </div>

        <DocumentsPanel initialDocuments={documents} />
      </div>
    </div>
  );
}
