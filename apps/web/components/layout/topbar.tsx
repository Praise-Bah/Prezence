import Image from 'next/image';
import type { UserProfile } from '@prezence/types';
import { ChevronDown, MessageSquare, Search } from 'lucide-react';
import { Badge } from '../ui/badge';
import { NotificationBell } from './notification-bell';

interface TopbarProps {
  user: UserProfile;
  title: string;
}

const planVariant: Record<string, 'default' | 'success' | 'info' | 'purple'> = {
  free: 'default',
  starter: 'info',
  professional: 'purple',
  elite: 'success',
};

const TOPBAR_ASSETS = {
  userAvatar: '/assets/placeholders/shared-user-avatar@72x72.webp',
} as const;

function displayName(user: UserProfile): string {
  const local = user.email.split('@')[0] ?? user.email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function Topbar({ user, title }: TopbarProps) {
  return (
    <header className="flex h-[71px] shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white px-6">
      <h1 className="text-[19px] tracking-[0.1px] text-[#1a1a2e]">{title}</h1>

      <div className="flex items-center gap-2.5">
        {/* Search — styled per Figma pill controls; UI-only for now */}
        <div className="hidden items-center gap-2 rounded-full bg-[#f8f9fa] px-4 py-3 shadow-[0_4px_3px_rgba(0,0,0,0.02)] md:flex">
          <Search className="h-[22px] w-[22px] text-[#787c91]" strokeWidth={1.75} />
          <span className="text-sm text-[#787c91]">Search…</span>
        </div>

        <button
          type="button"
          aria-label="Messages"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f9fa] shadow-[0_4px_3px_rgba(0,0,0,0.02)] transition hover:bg-[#eef2ff]"
        >
          <MessageSquare className="h-[22px] w-[22px] text-[#1a1a2e]" strokeWidth={1.75} />
        </button>

        <NotificationBell />

        <div className="flex items-center gap-2.5 rounded-3xl bg-[#f8f9fa] py-1.5 pl-1.5 pr-5">
          <Image
            src={TOPBAR_ASSETS.userAvatar}
            alt=""
            width={38}
            height={38}
            className="h-[38px] w-[38px] rounded-full object-cover"
          />
          <div className="hidden flex-col sm:flex">
            <span className="text-sm text-[#1a1a2e]">{displayName(user)}</span>
            <span className="text-xs text-[rgba(41,45,50,0.44)] capitalize">{user.plan} plan</span>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-[#787c91] sm:block" />
        </div>

        <Badge variant={planVariant[user.plan] ?? 'default'} className="capitalize sm:hidden">
          {user.plan}
        </Badge>
      </div>
    </header>
  );
}
