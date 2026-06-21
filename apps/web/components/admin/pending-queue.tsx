'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PendingSubmission } from '../../lib/actions/admin.actions';
import { reviewRequestAction } from '../../lib/actions/admin.actions';
import { Button } from '../ui/button';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free — 3,000 XAF',
  professional: 'Professional — 6,000 XAF',
  elite: 'Elite — 12,000 XAF',
};

const METHOD_LABELS: Record<string, string> = {
  mtn_momo: 'MTN MoMo',
  orange_money: 'Orange Money',
  flutterwave: 'Flutterwave',
  paystack: 'Paystack',
  stripe: 'Stripe',
};

function ConfidenceBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs text-[#888780]">—</span>;
  const styles: Record<string, string> = {
    HIGH: 'bg-green-100 text-green-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-orange-100 text-orange-700',
    SUSPICIOUS: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
        styles[level] ?? 'bg-[#e2e8f0] text-[#1a1a2e]',
      )}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_ai_review: 'bg-blue-100 text-blue-700',
    provisional: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
        styles[status] ?? 'bg-[#e2e8f0] text-[#1a1a2e]',
      )}
    >
      {status === 'pending_ai_review' ? 'Pending review' : 'Provisional'}
    </span>
  );
}

interface ReviewModalProps {
  request: PendingSubmission;
  onClose: () => void;
  onDone: () => void;
}

function ReviewModal({ request, onClose, onDone }: ReviewModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!action) return;
    if (action === 'reject' && !notes.trim()) {
      setNotice({ type: 'error', text: 'A rejection reason is required.' });
      return;
    }
    startTransition(async () => {
      const result = await reviewRequestAction(request.id, {
        action,
        adminNotes: notes.trim() || undefined,
      });
      if (result.error) {
        setNotice({ type: 'error', text: result.error });
      } else {
        setNotice({ type: 'success', text: result.success ?? 'Done.' });
        setTimeout(() => { onDone(); }, 1200);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,42,82,0.65)] p-4">
      <div className="relative w-full max-w-lg rounded-[16px] bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#888780] hover:text-[#1a1a2e]"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-[#1a1a2e]">Review Submission</h3>

        <div className="mt-4 space-y-2 rounded-[10px] bg-[#f8f9fa] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[#888780]">User</span>
            <span className="font-medium text-[#1a1a2e]">{request.userEmail ?? request.userId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888780]">Plan</span>
            <span className="font-medium text-[#1a1a2e]">{PLAN_LABELS[request.plan] ?? request.plan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888780]">Amount</span>
            <span className="font-medium text-[#1a1a2e]">{request.amountXaf.toLocaleString()} XAF</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888780]">Method</span>
            <span className="font-medium text-[#1a1a2e]">{METHOD_LABELS[request.paymentMethod] ?? request.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888780]">Reference</span>
            <span className="font-mono text-xs text-[#1a1a2e]">{request.paymentReference}</span>
          </div>
          {request.transactionRef && (
            <div className="flex justify-between">
              <span className="text-[#888780]">Transaction ID</span>
              <span className="font-mono text-xs text-[#1a1a2e]">{request.transactionRef}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#888780]">AI Confidence</span>
            <ConfidenceBadge level={request.aiConfidenceLevel} />
          </div>
          {request.aiConfidence !== null && (
            <div className="flex justify-between">
              <span className="text-[#888780]">Score</span>
              <span className="font-medium text-[#1a1a2e]">{request.aiConfidence}/100</span>
            </div>
          )}
        </div>

        {request.screenshotUrl && (
          <a
            href={request.screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 text-sm font-medium text-[#1d4e8a] hover:underline"
          >
            View payment screenshot
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-[#1a1a2e]">Decision</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={cn(
                'flex-1 rounded-[10px] border py-2 text-sm font-semibold transition',
                action === 'approve'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-[#e2e8f0] text-[#1a1a2e] hover:border-green-300',
              )}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => setAction('reject')}
              className={cn(
                'flex-1 rounded-[10px] border py-2 text-sm font-semibold transition',
                action === 'reject'
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-[#e2e8f0] text-[#1a1a2e] hover:border-red-300',
              )}
            >
              Reject
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-[#1a1a2e]">
            {action === 'reject' ? 'Rejection reason (required)' : 'Admin notes (optional)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={
              action === 'reject'
                ? 'Explain why this payment cannot be verified…'
                : 'Any notes for this approval…'
            }
            className="mt-2 w-full rounded-[10px] border border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#1d4e8a]"
          />
        </div>

        {notice && (
          <p
            className={cn(
              'mt-3 rounded-[10px] border px-4 py-2 text-sm',
              notice.type === 'success'
                ? 'border-[rgba(15,110,86,0.2)] bg-[#f0faf6] text-[#0f6e56]'
                : 'border-[rgba(192,57,43,0.2)] bg-[rgba(192,57,43,0.05)] text-[#c0392b]',
            )}
          >
            {notice.text}
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
          <Button
            type="button"
            variant="auth"
            className="flex-1 rounded-[10px]"
            onClick={handleSubmit}
            disabled={!action || isPending}
          >
            {isPending ? 'Submitting…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PendingQueueProps {
  requests: PendingSubmission[];
}

export function PendingQueue({ requests }: PendingQueueProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<PendingSubmission | null>(null);

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#cdd5e9] bg-white p-16 text-center">
        <p className="text-[#888780]">No submissions awaiting review.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-[#1a1a2e]">
                  {req.userEmail ?? req.userId}
                </span>
                <StatusBadge status={req.status} />
                <ConfidenceBadge level={req.aiConfidenceLevel} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#888780]">
                <span>{PLAN_LABELS[req.plan] ?? req.plan}</span>
                <span>{METHOD_LABELS[req.paymentMethod] ?? req.paymentMethod}</span>
                <span>{new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelected(req)}
              className="shrink-0 rounded-full bg-[#6366f1] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#4f46e5]"
            >
              Review
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <ReviewModal
          request={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
