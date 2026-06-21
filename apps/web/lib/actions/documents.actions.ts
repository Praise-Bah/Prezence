'use server';

import { revalidatePath } from 'next/cache';
import type { UserDocument } from '@prezence/types';
import { api, ApiError } from '../api';

function revalidateDocumentPaths(): void {
  revalidatePath('/documents');
  revalidatePath('/onboarding/documents');
}

export async function listDocumentsAction(): Promise<UserDocument[]> {
  return api.get<UserDocument[]>('/documents');
}

export async function uploadDocumentAction(
  formData: FormData,
): Promise<{ document: UserDocument } | { error: string }> {
  try {
    const document = await api.postForm<UserDocument>('/documents', formData);
    revalidateDocumentPaths();
    return { document };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to upload document.' };
  }
}

export async function deleteDocumentAction(
  id: string,
): Promise<{ success: true } | { error: string }> {
  try {
    await api.delete(`/documents/${id}`);
    revalidateDocumentPaths();
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.message };
    return { error: 'Failed to delete document.' };
  }
}
