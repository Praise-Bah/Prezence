'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NotificationBellProps {
  initialCount?: number;
}

export function NotificationBell({ initialCount = 0 }: NotificationBellProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    fetch('/api/notifications/unread')
      .then((r) => r.json())
      .then((d: { count: number }) => setCount(d.count))
      .catch(() => undefined);
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
      className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f9fa] shadow-[0_4px_3px_rgba(0,0,0,0.02)] transition hover:bg-[#eef2ff]"
    >
      <Bell className="h-[22px] w-[22px] text-[#1a1a2e]" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute right-2 top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[10px] font-semibold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
