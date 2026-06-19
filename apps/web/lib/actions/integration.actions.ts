'use server';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

export interface ActionResult {
  error?: string;
  success?: string;
}

export async function disconnectPlatformAction(platform: string): Promise<ActionResult> {
  const { cookies } = await import('next/headers');
  const jar = await cookies();
  const token = jar.get('prezence_at')?.value;
  if (!token) return { error: 'Not authenticated.' };

  try {
    const res = await fetch(`${API_BASE}/integration/disconnect/${platform}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return { error: body.message ?? 'Failed to disconnect.' };
    }

    return { success: `${platform} disconnected successfully.` };
  } catch {
    return { error: 'Could not connect to the server. Please try again.' };
  }
}
