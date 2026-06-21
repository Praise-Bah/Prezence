'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Plug } from 'lucide-react';
import { disconnectPlatformAction } from '../../lib/actions/integration.actions';

// ─── Platform display metadata ────────────────────────────────────────────────

interface PlatformMeta {
  id: string;
  label: string;
  subtitle: string;
  /** Hex color for the Connect CTA (per Figma: Facebook/Fiverr = #3771C8, Instagram = #1A1A2E) */
  buttonColor: string;
  phase: 1 | 2 | 3;
}

const PLATFORMS: PlatformMeta[] = [
  // Phase 1 — available now
  { id: 'facebook',          label: 'Facebook',        subtitle: 'Business page',        buttonColor: '#3771C8', phase: 1 },
  { id: 'instagram',         label: 'Instagram',       subtitle: 'Creator profile',       buttonColor: '#1A1A2E', phase: 1 },
  { id: 'fiverr',            label: 'Fiverr',          subtitle: 'Seller profile',        buttonColor: '#3771C8', phase: 1 },
  { id: 'linkedin',          label: 'LinkedIn',        subtitle: 'Professional profile',  buttonColor: '#0A66C2', phase: 1 },
  { id: 'github',            label: 'GitHub',          subtitle: 'Developer profile',     buttonColor: '#24292e', phase: 1 },
  { id: 'tiktok',            label: 'TikTok',          subtitle: 'Creator profile',       buttonColor: '#010101', phase: 1 },
  { id: 'freelancer',        label: 'Freelancer',      subtitle: 'Freelancer profile',    buttonColor: '#29B2FE', phase: 1 },

  // Phase 2 — coming soon
  { id: 'twitter',           label: 'X (Twitter)',     subtitle: 'Social profile',        buttonColor: '#000000', phase: 2 },
  { id: 'pinterest',         label: 'Pinterest',       subtitle: 'Creative boards',       buttonColor: '#E60023', phase: 2 },
  { id: 'upwork',            label: 'Upwork',          subtitle: 'Freelancer profile',    buttonColor: '#6FDA44', phase: 2 },
  { id: 'behance',           label: 'Behance',         subtitle: 'Portfolio',             buttonColor: '#1769FF', phase: 2 },
  { id: 'dribbble',          label: 'Dribbble',        subtitle: 'Design shots',          buttonColor: '#EA4C89', phase: 2 },
  { id: 'medium',            label: 'Medium',          subtitle: 'Blog & articles',       buttonColor: '#000000', phase: 2 },
  { id: 'devto',             label: 'DEV.to',          subtitle: 'Developer blog',        buttonColor: '#0A0A0A', phase: 2 },
  { id: 'hashnode',          label: 'Hashnode',        subtitle: 'Tech blog',             buttonColor: '#2962FF', phase: 2 },
  { id: 'youtube',           label: 'YouTube',         subtitle: 'Channel profile',       buttonColor: '#FF0000', phase: 2 },

  // Phase 3 — coming soon
  { id: 'stackoverflow',     label: 'Stack Overflow',  subtitle: 'Q&A profile',           buttonColor: '#F58025', phase: 3 },
  { id: 'kaggle',            label: 'Kaggle',          subtitle: 'Data science profile',  buttonColor: '#20BEFF', phase: 3 },
  { id: 'snapchat',          label: 'Snapchat',        subtitle: 'Creator profile',       buttonColor: '#FFFC00', phase: 3 },
  { id: 'whatsapp_business', label: 'WhatsApp Business', subtitle: 'Business profile',   buttonColor: '#25D366', phase: 3 },
];

const PHASE_1 = PLATFORMS.filter((p) => p.phase === 1);
const PHASE_2_PLUS = PLATFORMS.filter((p) => p.phase >= 2);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveNotice(
  connected: string | null,
  error: string | null,
): { type: 'success' | 'error'; message: string } | null {
  if (connected) {
    const found = PLATFORMS.find((p) => p.id === connected);
    const label = found?.label ?? connected;
    return { type: 'success', message: `${label} connected successfully.` };
  }
  if (error) {
    return {
      type: 'error',
      message: error.endsWith('_oauth_denied')
        ? 'OAuth authorisation was cancelled.'
        : 'Connection failed. Please try again.',
    };
  }
  return null;
}

// ─── Platform card ────────────────────────────────────────────────────────────

interface PlatformCardProps {
  platform: PlatformMeta;
  isConnected: boolean;
  isDisconnecting: boolean;
  onDisconnect: () => void;
  isPending: boolean;
}

function PlatformCard({
  platform,
  isConnected,
  isDisconnecting,
  onDisconnect,
  isPending,
}: PlatformCardProps) {
  const { id, label, subtitle, buttonColor } = platform;

  return (
    <div
      className="flex min-h-[320px] flex-col items-center gap-[35px] rounded-[25px] border bg-white px-[1px] py-[5px] pt-8 pb-7"
      style={{ borderColor: 'rgba(152,152,255,0.26)' }}
    >
      {/* Card header: icon + name/subtitle */}
      <div className="flex w-[292px] items-center gap-[30px]">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center">
          <Image
            src={`/assets/platforms/${id}.svg`}
            alt={label}
            width={34}
            height={34}
            className="object-contain"
          />
        </div>
        <div>
          <p
            className="text-[16px] font-medium leading-tight"
            style={{ color: '#1a1a2e', letterSpacing: '0.08px' }}
          >
            {label}
          </p>
          <p
            className="text-[12px] font-normal leading-snug"
            style={{ color: '#1a1a2e', letterSpacing: '0.06px' }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Status badge */}
      {isConnected ? (
        <div
          className="flex h-[31px] w-[292px] items-center justify-center rounded-[5.84px] text-[14px] font-semibold"
          style={{
            border: '0.73px solid #0F6E56',
            color: '#0F6E56',
          }}
        >
          Connected
        </div>
      ) : (
        <div
          className="flex h-[31px] w-[292px] items-center justify-center rounded-[5.84px] text-[14px] font-semibold"
          style={{
            border: '0.73px solid #1A1A2E',
            color: '#1A1A2E',
          }}
        >
          Not connected
        </div>
      )}

      {/* OAuth security strip */}
      <div
        className="flex h-[56px] w-[292px] items-center gap-3 rounded-[8px] px-[15px]"
        style={{ background: 'rgba(26,26,46,0.02)' }}
      >
        <Lock size={24} color="#1A1A2E" strokeWidth={1.5} />
        <span className="text-[16px] font-normal text-[#1A1A2E]">
          Secure OAuth 2.0 · your password is never stored
        </span>
      </div>

      {/* Connect / Update / Disconnect button */}
      {isConnected ? (
        <div className="flex w-[292px] flex-col gap-2">
          <a
            href={`/api/integration/oauth/${id}/start`}
            className="flex h-[43px] w-full items-center justify-center gap-1 rounded-[8px] text-[16px] font-semibold leading-[26.4px] text-white transition hover:opacity-90"
            style={{ backgroundColor: '#0F6E56' }}
          >
            Update profile
          </a>
          <button
            type="button"
            disabled={isPending}
            onClick={onDisconnect}
            className="flex h-[36px] w-full items-center justify-center rounded-[8px] border border-[#e2e8f0] text-[14px] font-medium text-[#888780] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
          >
            {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <a
          href={`/api/integration/oauth/${id}/start`}
          className="flex h-[43px] w-[292px] items-center justify-center gap-1 rounded-[8px] text-[16px] font-semibold leading-[26.4px] text-white transition hover:opacity-90"
          style={{ backgroundColor: buttonColor }}
        >
          <Plug size={24} strokeWidth={1.5} />
          <span className="ml-1">Connect {label}</span>
        </a>
      )}
    </div>
  );
}

// ─── Coming soon card ─────────────────────────────────────────────────────────

function ComingSoonCard({ platform }: { platform: PlatformMeta }) {
  const { id, label, subtitle } = platform;

  return (
    <div
      className="flex min-h-[320px] flex-col items-center gap-[35px] rounded-[25px] border bg-white px-[1px] py-[5px] pt-8 pb-7 opacity-50"
      style={{ borderColor: 'rgba(152,152,255,0.26)' }}
    >
      {/* Card header */}
      <div className="flex w-[292px] items-center gap-[30px]">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center">
          <Image
            src={`/assets/platforms/${id}.svg`}
            alt={label}
            width={34}
            height={34}
            className="object-contain"
          />
        </div>
        <div>
          <p
            className="text-[16px] font-medium leading-tight"
            style={{ color: '#1a1a2e', letterSpacing: '0.08px' }}
          >
            {label}
          </p>
          <p
            className="text-[12px] font-normal leading-snug"
            style={{ color: '#1a1a2e', letterSpacing: '0.06px' }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Coming Soon badge */}
      <div
        className="flex h-[31px] w-[292px] items-center justify-center rounded-[5.84px] text-[14px] font-semibold"
        style={{ border: '0.73px solid #888780', color: '#888780' }}
      >
        Coming soon
      </div>

      {/* Placeholder strip */}
      <div
        className="flex h-[56px] w-[292px] items-center gap-3 rounded-[8px] px-[15px]"
        style={{ background: 'rgba(26,26,46,0.02)' }}
      >
        <Lock size={24} color="#888780" strokeWidth={1.5} />
        <span className="text-[16px] font-normal text-[#888780]">
          Available in a future release
        </span>
      </div>

      {/* Disabled button */}
      <div
        className="flex h-[43px] w-[292px] cursor-not-allowed items-center justify-center gap-1 rounded-[8px] text-[16px] font-semibold text-[#888780]"
        style={{ border: '0.73px solid #888780' }}
      >
        Coming soon
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ConnectPlatformsProps {
  connectedPlatforms: string[];
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

  function handleDisconnect(platformId: string) {
    setDisconnecting(platformId);
    startTransition(async () => {
      const result = await disconnectPlatformAction(platformId);
      setDisconnecting(null);
      if (result.error) {
        setNotice({ type: 'error', message: result.error });
      } else {
        setNotice({ type: 'success', message: result.success ?? 'Disconnected.' });
        router.refresh();
      }
    });
  }

  const connectedCount = PHASE_1.filter((p) => connectedPlatforms.includes(p.id)).length;

  return (
    <section className="mt-10" aria-label="Connect platforms">
      {/* Section header */}
      <div
        className="mb-[21px] flex h-[68px] items-center justify-between"
      >
        <h2
          className="text-[20px] font-semibold tracking-[0.1px]"
          style={{ color: '#1A1A2E' }}
        >
          Connect platforms
        </h2>
        <div
          className="flex h-[27px] min-w-[163px] items-center justify-center rounded-[5.84px] px-4 text-[19.8px] font-semibold leading-[26.4px]"
          style={{ border: '0.73px solid #1A1A2E', color: '#1A1A2E' }}
        >
          {connectedCount} of {PHASE_1.length} connected
        </div>
      </div>

      {/* Toast notice */}
      {notice && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
            notice.type === 'success'
              ? 'bg-[#f0fdf4] text-[#0F6E56]'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Phase 1 grid */}
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
        {PHASE_1.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            isConnected={connectedPlatforms.includes(platform.id)}
            isDisconnecting={disconnecting === platform.id}
            onDisconnect={() => handleDisconnect(platform.id)}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Phase 2+ coming soon grid */}
      <div className="mt-10">
        <h3
          className="mb-[21px] text-[18px] font-semibold tracking-[0.1px]"
          style={{ color: '#1A1A2E' }}
        >
          Coming soon
        </h3>
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {PHASE_2_PLUS.map((platform) => (
            <ComingSoonCard key={platform.id} platform={platform} />
          ))}
        </div>
      </div>

      {/* Security footer */}
      <div
        className="mt-10 flex items-center justify-center gap-2 rounded-[5px] px-6 py-4 text-sm text-[#0F6E56]"
        style={{ background: '#F5FFF7', minHeight: '104px' }}
      >
        <Lock size={18} strokeWidth={1.5} />
        <span>
          Prezence uses secure OAuth 2.0 to connect your accounts. We never ask for your
          password and you can disconnect at any time.
        </span>
      </div>
    </section>
  );
}
