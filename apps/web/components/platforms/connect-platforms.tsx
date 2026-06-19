'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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

export function ConnectPlatforms({ connectedPlatforms }: ConnectPlatformsProps) {
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      const label = connected === 'facebook' ? 'Facebook / Instagram' : 'LinkedIn';
      setNotice({ type: 'success', message: `${label} connected successfully.` });
    } else if (error) {
      const isdenied = error.endsWith('_oauth_denied');
      setNotice({
        type: 'error',
        message: isdenied
          ? 'OAuth authorization was cancelled.'
          : 'Connection failed. Please try again.',
      });
    }

    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [searchParams]);

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
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Connected
                </span>
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
