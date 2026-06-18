import { type NextRequest, NextResponse } from 'next/server';
import { COOKIE_AT, COOKIE_RT, AT_MAX_AGE, RT_MAX_AGE } from '../../../../lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const next = request.nextUrl.searchParams.get('next') ?? '/dashboard';
  const refreshToken = request.cookies.get(COOKIE_RT)?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete(COOKIE_AT);
      response.cookies.delete(COOKIE_RT);
      return response;
    }

    const data = (await res.json()) as { access_token: string; refresh_token: string };
    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.set(COOKIE_AT, data.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: AT_MAX_AGE,
    });
    response.cookies.set(COOKIE_RT, data.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: RT_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
