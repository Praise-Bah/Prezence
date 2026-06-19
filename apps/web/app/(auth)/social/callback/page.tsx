import { redirect } from 'next/navigation';
import { setAuthCookies } from '../../../../lib/auth';

interface ExchangeResponse {
  accessToken: string;
  refreshToken: string;
}

async function exchangeCode(code: string): Promise<ExchangeResponse | null> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return (await res.json()) as ExchangeResponse;
  } catch {
    return null;
  }
}

type SearchParams = Promise<{ code?: string; provider?: string }>;

export default async function SocialCallbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { code } = await searchParams;

  if (!code) {
    redirect('/login?error=oauth_failed');
  }

  const tokens = await exchangeCode(code);

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    redirect('/login?error=oauth_failed');
  }

  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  redirect('/dashboard');
}
