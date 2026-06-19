import { redirect } from 'next/navigation';

const ALLOWED_PROVIDERS = new Set(['google', 'facebook']);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return new Response('Unknown OAuth provider', { status: 400 });
  }

  // Use the public-facing API URL so the browser can reach it.
  // API_URL may be an internal address (e.g. http://api:3001 in Docker).
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_URL ??
    'http://localhost:3001';

  redirect(`${apiUrl}/auth/${provider}`);
}
