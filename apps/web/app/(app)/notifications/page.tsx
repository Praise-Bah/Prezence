import type { Metadata } from 'next';
import { requireUser } from '../../../lib/auth';
import { api, ApiError } from '../../../lib/api';
import { Topbar } from '../../../components/layout/topbar';
import {
  mapApiNotification,
  NotificationsPanel,
  type Notification,
} from '../../../components/notifications/notifications-panel';

export const metadata: Metadata = { title: 'Notifications' };

async function fetchNotifications(): Promise<Notification[]> {
  try {
    const data = await api.get<Parameters<typeof mapApiNotification>[0][]>(
      '/notifications',
    );
    return data.map(mapApiNotification);
  } catch (error) {
    if (error instanceof ApiError) {
      return [];
    }
    return [];
  }
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await fetchNotifications();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fa]">
      <Topbar user={user} title="Notification" />

      <div className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <NotificationsPanel initialNotifications={notifications} />
        </div>
      </div>
    </div>
  );
}
