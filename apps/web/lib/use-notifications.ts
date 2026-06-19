'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Notification } from '../components/notifications/notifications-panel';

export interface WsNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  action_url: string | null;
  created_at: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

async function fetchTicket(): Promise<string | null> {
  try {
    const res = await fetch('/api/ws-ticket');
    if (!res.ok) return null;
    const data = (await res.json()) as { ticket?: string };
    return data.ticket ?? null;
  } catch {
    return null;
  }
}

function wsNotificationToNotification(n: WsNotification): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: false,
    created_at: n.created_at,
  };
}

export function useNotifications(initialNotifications: Notification[]) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const ticket = await fetchTicket();
      if (cancelled || !ticket) return;

      const socket = io(`${WS_URL}/events`, {
        auth: { ticket },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      // Ticket is single-use; fetch a fresh one before each reconnect attempt
      // so the gateway doesn't reject an already-consumed ticket.
      socket.on('reconnect_attempt', () => {
        void fetchTicket().then((t) => {
          if (t) socket.auth = { ticket: t };
        });
      });

      socket.on('notification:new', (payload: WsNotification) => {
        setNotifications((prev) => [
          wsNotificationToNotification(payload),
          ...prev,
        ]);
      });
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const markRead = (id: string): void => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    void fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP error');
      })
      .catch(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
        );
      });
  };

  const markAllRead = (): void => {
    const revertSet = new Set<string>();
    setNotifications((prev) => {
      for (const n of prev) {
        if (!n.read) revertSet.add(n.id);
      }
      return prev.map((n) => ({ ...n, read: true }));
    });
    void fetch('/api/notifications/read-all', { method: 'PATCH' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP error');
      })
      .catch(() => {
        setNotifications((prev) =>
          prev.map((n) => (revertSet.has(n.id) ? { ...n, read: false } : n)),
        );
      });
  };

  return { notifications, unreadCount, markRead, markAllRead };
}
