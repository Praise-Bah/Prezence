import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { UserProfile } from '@prezence/types';
import { api, ApiError } from './api';

export const COOKIE_AT = 'prezence_at';
export const COOKIE_RT = 'prezence_rt';

export const AT_MAX_AGE = 60 * 15;      // 15 min — matches JWT expiry
export const RT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    return await api.get<UserProfile>('/auth/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_AT, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: AT_MAX_AGE,
  });
  store.set(COOKIE_RT, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: RT_MAX_AGE,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_AT);
  store.delete(COOKIE_RT);
}
