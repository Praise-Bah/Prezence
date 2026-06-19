import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
): Promise<NextResponse> {
  const { platform } = await params;
  const token = request.cookies.get('prezence_at')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const res = await fetch(`${API_BASE}/integration/oauth/${platform}/start`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.redirect(
        new URL(`/platforms?error=${platform}_oauth_failed`, request.url),
      );
    }

    const data = (await res.json()) as { authUrl: string };
    return NextResponse.redirect(data.authUrl);
  } catch {
    return NextResponse.redirect(
      new URL(`/platforms?error=${platform}_oauth_failed`, request.url),
    );
  }
}
