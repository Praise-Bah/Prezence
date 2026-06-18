import { type NextRequest, NextResponse } from 'next/server';
import { COOKIE_AT, COOKIE_RT } from './lib/auth';

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/auth/refresh'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const hasAccessToken = Boolean(request.cookies.get(COOKIE_AT)?.value);
  const hasRefreshToken = Boolean(request.cookies.get(COOKIE_RT)?.value);

  if (hasAccessToken) return NextResponse.next();

  if (hasRefreshToken) {
    const refreshUrl = new URL('/api/auth/refresh', request.url);
    refreshUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(refreshUrl);
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
