'use server';

import { redirect } from 'next/navigation';
import type { UserProfile } from '@prezence/types';
import { setAuthCookies, clearAuthCookies } from '../auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export interface AuthState {
  error?: string;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: 'Email and password are required.' };

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (res.status === 423) return { error: 'Account is locked. Try again in 15 minutes.' };
      if (res.status === 401) return { error: 'Invalid email or password.' };
      return { error: body.message ?? 'Login failed.' };
    }

    const data = (await res.json()) as AuthResponse;
    await setAuthCookies(data.access_token, data.refresh_token);
  } catch {
    return { error: 'Could not connect to the server. Please try again.' };
  }

  redirect('/dashboard');
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const country_code = (formData.get('country_code') as string) || 'CM';
  const language = (formData.get('language') as string) || 'en';

  if (!email || !password) return { error: 'Email and password are required.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, country_code, language }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (res.status === 409) return { error: 'An account with this email already exists.' };
      return { error: body.message ?? 'Registration failed.' };
    }

    const data = (await res.json()) as AuthResponse;
    await setAuthCookies(data.access_token, data.refresh_token);
  } catch {
    return { error: 'Could not connect to the server. Please try again.' };
  }

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  await clearAuthCookies();
  redirect('/login');
}
