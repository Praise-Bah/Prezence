'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, type TabItem } from '../ui/tabs';
import { formatRelativeTime } from '../../lib/format-relative-time';
import { useNotifications } from '../../lib/use-notifications';
import { cn } from '../../lib/utils';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

const TABS: TabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'updates', label: 'Updates' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'alerts', label: 'Alerts' },
];

function notificationCategory(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes('approval') || normalized.includes('review')) return 'approvals';
  if (
    normalized.includes('fail') ||
    normalized.includes('error') ||
    normalized.includes('alert') ||
    normalized.includes('sync')
  ) {
    return 'alerts';
  }
  return 'updates';
}

function NotificationIcon({ type }: { type: string }) {
  const category = notificationCategory(type);
  if (category === 'alerts') {
    return (
      <div className="rounded-[10px] bg-red-100 p-2">
        <AlertCircle className="h-5 w-5 text-red-600" strokeWidth={1.75} />
      </div>
    );
  }
  if (category === 'approvals') {
    return (
      <div className="rounded-[10px] bg-[#d5e8f5] p-2">
        <FileText className="h-5 w-5 text-[#1d4e8a]" strokeWidth={1.75} />
      </div>
    );
  }
  if (type.toLowerCase().includes('score')) {
    return (
      <div className="rounded-[10px] bg-teal-100 p-2">
        <TrendingUp className="h-5 w-5 text-teal-600" strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <div className="rounded-[10px] bg-[#d5e8f5] p-2">
      <CheckCircle2 className="h-5 w-5 text-[#1d4e8a]" strokeWidth={1.75} />
    </div>
  );
}

function actionLabel(type: string): string | null {
  const normalized = type.toLowerCase();
  if (normalized.includes('approval') || normalized.includes('review')) return 'Review now';
  if (normalized.includes('fail') || normalized.includes('sync')) return 'Retry';
  if (normalized.includes('update') || normalized.includes('readme')) return 'View proof';
  return null;
}

interface NotificationsPanelProps {
  initialNotifications: Notification[];
}

export function NotificationsPanel({ initialNotifications }: NotificationsPanelProps) {
  const { notifications: items, markAllRead } = useNotifications(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (dismissed.has(item.id)) return false;
      if (activeTab === 'all') return true;
      return notificationCategory(item.type) === activeTab;
    });
  }, [activeTab, dismissed, items]);

  const dismiss = (id: string): void => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-medium leading-[42px] text-[#1a1a2e]">Notifications</h1>
          <p className="mt-1 text-base text-[#888780]">
            Stay updated on your profile changes and system events
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-medium text-[#1d4e8a] transition hover:text-[#163d6e]"
          >
            Mark all as read
          </button>
        )}
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cdd5e9] bg-white p-12 text-center">
          <p className="text-[#787c91]">
            {items.length === 0
              ? 'No notifications yet. We will let you know when something needs your attention.'
              : 'No notifications in this category.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleItems.map((item) => {
            const action = actionLabel(item.type);
            return (
              <li
                key={item.id}
                className={cn(
                  'relative rounded-[10px] border bg-[#f8f9fa] p-[17px]',
                  !item.read
                    ? 'border-[rgba(29,78,138,0.3)]'
                    : 'border-[rgba(26,26,46,0.1)]',
                )}
              >
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(item.id)}
                  className="absolute right-4 top-4 rounded p-1 text-[#787c91] transition hover:bg-white hover:text-[#1a1a2e]"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex gap-4 pr-8">
                  <NotificationIcon type={item.type} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-medium text-[#1a1a2e]">{item.title}</h2>
                      {!item.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#1d4e8a]" />
                      )}
                    </div>
                    <p className="text-sm text-[#888780]">{item.body}</p>
                    <p className="mt-2 text-xs text-[#888780]">
                      {formatRelativeTime(item.created_at)}
                    </p>
                    {action && (
                      <Button
                        variant={action === 'Review now' || action === 'Retry' ? 'auth' : 'secondary'}
                        size="sm"
                        disabled
                        className={cn(
                          'mt-3 rounded-md',
                          action === 'View proof' && 'bg-[#d5e8f5] text-[#1d4e8a] hover:bg-[#d5e8f5]',
                        )}
                      >
                        {action}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at?: string;
  createdAt?: string;
}

export function mapApiNotification(raw: ApiNotification): Notification {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    body: raw.body,
    read: raw.read,
    created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}
