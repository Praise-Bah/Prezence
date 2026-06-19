import { redirect } from 'next/navigation';

const ALLOWED_PROVIDERS = new Set(['google', 'facebook']);

export function GET(
  _request: Request,
  { params }: { params: { provider: string } },
) {
  const { provider } = params;

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return new Response('Unknown OAuth provider', { status: 400 });
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  redirect(`${apiUrl}/auth/${provider}`);
}
