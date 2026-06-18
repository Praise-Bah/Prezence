'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserProfile } from '@prezence/types';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  Layers,
  PenLine,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { logoutAction } from '../../lib/actions/auth.actions';

const DASHBOARD_ASSETS = {
  logoExpanded: '/assets/brand/shared-logo-sidebar@133x32.png',
  logoIcon: '/assets/brand/shared-logo-sidebar-icon@32x32.png',
  upgradeHero: '/assets/illustrations/shared-upgrade-hero@280x221.webp',
  userAvatar: '/assets/placeholders/shared-user-avatar@40x40.webp',
} as const;

const primaryNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ai', label: 'Prezence AI', icon: Sparkles },
  { href: '/content', label: 'Generate content', icon: PenLine },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/platforms', label: 'Platforms', icon: Layers },
  { href: '/profile', label: 'Profile', icon: User },
] as const;

const secondaryNav = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Subscription', icon: CreditCard },
  { href: '/notifications', label: 'Notifications', icon: Bell },
] as const;

interface SidebarProps {
  user: UserProfile;
}

function displayName(user: UserProfile): string {
  const local = user.email.split('@')[0] ?? user.email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string): boolean =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'relative flex h-full shrink-0 flex-col rounded-2xl bg-white shadow-[0_16px_22px_rgba(0,0,0,0.07)] transition-[width] duration-200',
        collapsed ? 'w-[76px]' : 'w-[280px]',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="relative flex items-center gap-3 p-6">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          {collapsed ? (
            <Image
              src={DASHBOARD_ASSETS.logoIcon}
              alt="Prezence"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0"
            />
          ) : (
            <Image
              src={DASHBOARD_ASSETS.logoExpanded}
              alt="Prezence"
              width={133}
              height={32}
              className="h-8 w-auto max-w-[133px] object-contain object-left"
            />
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-[#e2e8f0] bg-white p-1 shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-[#1a1a2e]" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-[#1a1a2e]" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-6">
        <div className="flex flex-col gap-1">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors',
                  active ? 'bg-[#eef2ff] text-[#1a1a2e]' : 'text-[#1a1a2e] hover:bg-[#f8f9fa]',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                {!collapsed && <span className="leading-5">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="h-px w-full bg-[#e2e8f0]" />

        <div className="flex flex-col gap-1">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'relative flex h-11 items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-colors',
                  active ? 'bg-[#eef2ff] text-[#1a1a2e]' : 'text-[#1a1a2e] hover:bg-[#f8f9fa]',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                {!collapsed && <span className="leading-5">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Upgrade card — free plan only */}
      {user.plan === 'free' && !collapsed && (
        <div className="mx-6 mb-4 flex flex-col items-center gap-3">
          <div className="relative h-[165px] w-[248px] overflow-hidden">
            <Image
              src={DASHBOARD_ASSETS.upgradeHero}
              alt=""
              width={280}
              height={221}
              className="h-full w-full object-contain object-center"
            />
          </div>
          <Link
            href="/billing"
            className="flex w-full items-center justify-center rounded-full bg-[#1a1a2e] px-6 py-3 text-xs font-medium text-[#f8f9fa] transition hover:bg-[#2a2a3e]"
          >
            Upgrade to Pro
          </Link>
        </div>
      )}

      {/* User row + sign out */}
      <div className="border-t border-[#e2e8f0] p-6">
        <div
          className={cn(
            'flex items-center gap-3',
            collapsed && 'flex-col',
          )}
        >
          <Image
            src={DASHBOARD_ASSETS.userAvatar}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium leading-5 text-[#1a1a2e]">Welcome back 👋</p>
              <p className="truncate text-sm font-medium leading-5 text-[#1a1a2e]">
                {displayName(user)}
              </p>
            </div>
          )}
          {!collapsed && (
            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="rounded-lg p-1 text-[#787c91] transition hover:bg-[#f8f9fa] hover:text-[#1a1a2e]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </form>
          )}
        </div>
        {collapsed && (
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              title="Sign out"
              className="w-full rounded-full py-2 text-xs text-[#787c91] hover:bg-[#f8f9fa] hover:text-[#1a1a2e]"
            >
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
