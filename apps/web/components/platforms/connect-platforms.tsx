'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { disconnectPlatformAction } from '../../lib/actions/integration.actions';

interface ConnectPlatformsProps {
  connectedPlatforms: string[];
}

const OAUTH_PLATFORMS = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'Publish your professional profile and posts',
    icon: '🔗',
  },
  {
    id: 'facebook',
    label: 'Facebook / Instagram',
    description: 'Manage your Pages and Instagram content',
    icon: '📘',
  },
] as const;

function resolveNotice(
  connected: string | null,
  error: string | null,
): { type: 'success' | 'error'; message: string } | null {
  if (connected) {
    const label = connected === 'facebook' ? 'Facebook / Instagram' : 'LinkedIn';
    return { type: 'success', message: `${label} connected successfully.` };
  }
  if (error) {
    return {
      type: 'error',
      message: error.endsWith('_oauth_denied')
        ? 'OAuth authorization was cancelled.'
        : 'Connection failed. Please try again.',
    };
  }
  return null;
}

export function ConnectPlatforms({ connectedPlatforms }: ConnectPlatformsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const initialNotice = useMemo(
    () => resolveNotice(searchParams.get('connected'), searchParams.get('error')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [notice, setNotice] = useState(initialNotice);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  function handleDisconnect(platform: string) {
    setDisconnecting(platform);
    startTransition(async () => {
      const result = await disconnectPlatformAction(platform);
      setDisconnecting(null);
      if (result.error) {
        setNotice({ type: 'error', message: result.error });
      } else {
        setNotice({ type: 'success', message: result.success ?? 'Disconnected.' });
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-8">
      <h2 className="mb-1 text-lg font-semibold text-[#1a1a2e]">Connect platforms</h2>
      <p className="mb-5 text-sm text-[#888780]">
        Link your social accounts so Prezence can publish your AI-generated profiles.
      </p>

      {notice && (
        <div
          className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${
            notice.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {notice.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {OAUTH_PLATFORMS.map(({ id, label, description, icon }) => {
          const isConnected = connectedPlatforms.includes(id);
          const isDisconnecting = disconnecting === id;
          return (
            <div
              key={id}
              className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a2e]">{label}</p>
                  <p className="text-xs text-[#888780]">{description}</p>
                </div>
              </div>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Connected
                  </span>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDisconnect(id)}
                    className="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-semibold text-[#888780] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                  >
                    {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                  </button>
                </div>
              ) : (
                <a
                  href={`/api/integration/oauth/${id}/start`}
                  className="rounded-full bg-[#6366f1] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#4f46e5]"
                >
                  Connect
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
