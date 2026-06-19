'use client';

import { useState, useTransition } from 'react';
import { Calendar, X } from 'lucide-react';
import type { SupportedPlatform } from '@prezence/types';
import { Button } from '../ui/button';
import type { ScheduledPost } from '../../lib/actions/content.actions';
import { schedulePostAction } from '../../lib/actions/content.actions';

interface SchedulePostModalProps {
  platform: SupportedPlatform;
  onClose: () => void;
  onScheduled: (post: ScheduledPost) => void;
}

export function SchedulePostModal({ platform, onClose, onScheduled }: SchedulePostModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const scheduledAt = (form.elements.namedItem('scheduledAt') as HTMLInputElement).value;

    if (!scheduledAt) {
      setError('Please choose a date and time.');
      return;
    }

    startTransition(async () => {
      const result = await schedulePostAction(platform, new Date(scheduledAt).toISOString());
      if ('error' in result) {
        setError(result.error);
      } else {
        onScheduled(result);
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#1d4e8a]" />
            <h2 className="text-base font-semibold text-[#1a1a2e]">Schedule post</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#717182] transition hover:bg-[#f1f5f9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <p className="mb-4 text-sm text-[#717182]">
            Your current content will be published to{' '}
            <span className="font-medium capitalize text-[#1a1a2e]">{platform}</span> at the
            selected time.
          </p>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#1a1a2e]">
              Publish date &amp; time
            </span>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className="w-full rounded-[10px] border border-[#cdd5e9] bg-[#f8f9fa] px-3 py-2 text-sm text-[#1a1a2e] outline-none focus:border-[#1d4e8a] focus:ring-1 focus:ring-[#1d4e8a]"
            />
          </label>

          {error && (
            <p className="mt-3 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 rounded-[10px]"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-[10px]" loading={isPending}>
              Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
