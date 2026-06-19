import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('prezence_at')?.value;

  if (!token) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ count: 0 });
    }

    const data = (await res.json()) as { is_read: boolean }[];
    const count = data.filter((n) => !n.is_read).length;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
