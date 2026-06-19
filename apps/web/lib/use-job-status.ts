'use client';

import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface JobUpdate {
  jobId: string;
  type: string;
  platform: string;
  status: 'running' | 'completed' | 'failed';
  errorMessage?: string;
}

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

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

export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus>('pending');
  const [update, setUpdate] = useState<JobUpdate | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let socket: Socket | null = null;
    let cancelled = false;

    void (async () => {
      const ticket = await fetchTicket();
      if (cancelled || !ticket) return;

      socket = io(`${WS_URL}/events`, {
        auth: { ticket },
        transports: ['websocket'],
        reconnection: false,
      });

      socket.on('job:update', (payload: JobUpdate) => {
        if (payload.jobId !== jobId) return;
        setStatus(payload.status);
        setUpdate(payload);
      });

      socket.on('connect_error', () => {
        if (!cancelled) setStatus('failed');
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [jobId]);

  return { status, update };
}
