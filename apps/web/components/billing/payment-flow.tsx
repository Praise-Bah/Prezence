'use client';

import { useState, useTransition } from 'react';
import {
  ArrowRight,
  Check,
  Lock,
  Shield,
  Upload,
  X,
} from 'lucide-react';
import type { SubscriptionPlan } from '@prezence/types';
import {
  initiatePaymentAction,
  uploadScreenshotAction,
  type InitPaymentResult,
} from '../../lib/actions/billing.actions';
import { PLAN_MODAL_DISPLAY, type PaidPlan } from './plan-data';
import { cn } from '../../lib/utils';

const PAYMENT_ASSETS = {
  mtnBadge: '/assets/payments/shared-mtn-momo@44x44.svg',
  mtnWordmark: '/assets/payments/shared-mtn-momo-wordmark@88x34.svg',
  orangeBadge: '/assets/payments/shared-orange-money@44x44.svg',
  orangeWordmark: '/assets/payments/shared-orange-money-wordmark@99x34.svg',
} as const;

interface PaymentFlowProps {
  plan: PaidPlan;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'method' | 'instructions' | 'upload' | 'done';

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(29,78,138,0.08)] px-6 py-[18px]">
      <div>
        <h2 className="text-base font-bold text-[#1a1a2e]">{title}</h2>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br from-[#0f6e56] to-[#1d8a7a] text-[8px] font-extrabold text-white">
            P
          </span>
          <span className="text-[11px] font-bold text-[#888780]">Secure checkout · Prezence</span>
          <Lock className="h-2.5 w-2.5 text-[#888780]" aria-hidden />
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#f0f0f0] text-[#888780] transition hover:bg-[#e5e5e5]"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function PlanSummaryBar({ plan }: { plan: PaidPlan }) {
  const display = PLAN_MODAL_DISPLAY[plan];
  return (
    <div className="rounded-[14px] border border-[rgba(29,78,138,0.12)] bg-[#f0f5fc] px-5 py-3.5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.88px] text-[#888780]">
            Plan selected
          </p>
          <p className="text-base font-extrabold text-[#1a1a2e]">{display.label}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#888780]">per month</p>
          <p
            className="text-xl font-extrabold tracking-[-0.4px]"
            style={{ color: display.priceColor }}
          >
            {display.price}
          </p>
        </div>
      </div>
    </div>
  );
}

function MethodOption({
  method,
  selected,
  onSelect,
}: {
  method: 'mtn_momo' | 'orange_money';
  selected: boolean;
  onSelect: () => void;
}) {
  const isMtn = method === 'mtn_momo';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-[18px] text-left transition',
        selected
          ? isMtn
            ? 'border-[#ffcb00] bg-[#fffbe6]'
            : 'border-[#f60] bg-[#fff5f0]'
          : 'border-transparent bg-[#f8f9fa]',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isMtn ? PAYMENT_ASSETS.mtnBadge : PAYMENT_ASSETS.orangeBadge}
        alt=""
        className="h-11 w-11 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#1a1a2e]">
          {isMtn ? 'MTN MoMo' : 'Orange Money'}
        </p>
        <p className="text-xs font-medium text-[#888780]">Mobile Money</p>
      </div>
      <span
        className={cn(
          'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[11px] border-2',
          selected
            ? isMtn
              ? 'border-[#ffcb00] bg-[#ffcb00]'
              : 'border-[#f60] bg-[#f60]'
            : 'border-[#d0d0d0] bg-white',
        )}
      >
        {selected && <Check className="h-3 w-3 text-[#1a1a2e]" strokeWidth={3} />}
      </span>
    </button>
  );
}

function PayingWithChip({ method }: { method: 'mtn_momo' | 'orange_money' }) {
  const isMtn = method === 'mtn_momo';
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[14px] border-[1.3px] px-5 py-4',
        isMtn ? 'border-[#ffcb00] bg-[#fffbe6]' : 'border-[#f60] bg-[#fff5f0]',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isMtn ? PAYMENT_ASSETS.mtnWordmark : PAYMENT_ASSETS.orangeWordmark}
        alt=""
        className={cn('shrink-0', isMtn ? 'h-[34px] w-[88px]' : 'h-[34px] w-[99px]')}
      />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.77px] text-[#888780]">
          Paying with
        </p>
        <p className="text-sm font-bold text-[#1a1a2e]">
          {isMtn ? 'MTN MoMo' : 'Orange Money'}
        </p>
      </div>
    </div>
  );
}

function ContinueButton({
  onClick,
  loading,
  label = 'Continue',
  variant = 'purple',
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  variant?: 'purple' | 'green';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3.5 text-[15px] font-bold text-white transition disabled:opacity-60',
        variant === 'purple'
          ? 'bg-gradient-to-br from-[#5b2d8e] to-[#1d8a7a] shadow-[0px_8px_12px_rgba(91,45,142,0.27)]'
          : 'bg-gradient-to-br from-[#0f6e56] to-[#1d8a7a] shadow-[0px_8px_12px_rgba(15,110,86,0.27)]',
      )}
    >
      {loading ? 'Please wait…' : label}
      {!loading && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function PaymentFlow({ plan, onClose, onSuccess }: PaymentFlowProps) {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [paymentInfo, setPaymentInfo] = useState<InitPaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);

  const modalDisplay = PLAN_MODAL_DISPLAY[plan];
  const continueVariant = plan === 'professional' ? 'green' : 'purple';

  function initiatePayment() {
    setError(null);
    startTransition(async () => {
      const result = await initiatePaymentAction(plan as SubscriptionPlan, method);
      if ('error' in result) {
        setError(result.error);
      } else {
        setPaymentInfo(result);
        setStep('instructions');
      }
    });
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paymentInfo) return;
    setError(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await uploadScreenshotAction(paymentInfo.requestId, form);
      if ('error' in result) {
        setError(result.error);
      } else {
        setStep('done');
        onSuccess();
      }
    });
  }

  const stepTitles: Record<Step, string> = {
    method: 'Choose payment method',
    instructions: `Pay with ${method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}`,
    upload: 'Upload payment proof',
    done: 'Payment submitted',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,42,82,0.65)] p-4">
      <div className="flex max-h-[90vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_40px_80px_0px_rgba(10,42,82,0.35)]">
        <ModalHeader title={stepTitles[step]} onClose={onClose} />

        <div className="overflow-y-auto p-6">
          {step === 'method' && (
            <div className="flex flex-col gap-5">
              <PlanSummaryBar plan={plan} />

              <p className="text-xs font-bold uppercase tracking-[1.08px] text-[#888780]">
                Select payment method
              </p>

              <div className="flex flex-col gap-3">
                <MethodOption
                  method="mtn_momo"
                  selected={method === 'mtn_momo'}
                  onSelect={() => setMethod('mtn_momo')}
                />
                <MethodOption
                  method="orange_money"
                  selected={method === 'orange_money'}
                  onSelect={() => setMethod('orange_money')}
                />
              </div>

              <div className="flex gap-2.5 rounded-xl border border-[rgba(15,110,86,0.15)] bg-[rgba(15,110,86,0.05)] px-4 py-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#0f6e56]" />
                <p className="text-xs leading-[19px] text-[#4a5e4a]">
                  <span className="font-bold">Prezence never stores your passwords or PINs.</span>{' '}
                  Payments are processed directly through your mobile money provider. You can
                  disconnect any time.
                </p>
              </div>

              {error && (
                <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <ContinueButton
                onClick={initiatePayment}
                loading={isPending}
                variant={continueVariant}
              />
            </div>
          )}

          {step === 'instructions' && paymentInfo && (
            <div className="flex flex-col gap-5">
              <PayingWithChip method={method} />

              <p className="text-[13px] leading-[20.8px] text-[#4a4a5e]">
                Send the exact amount below to the Prezence number via{' '}
                {method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}. Include the reference in
                your payment note.
              </p>

              <div className="rounded-[14px] border border-[rgba(29,78,138,0.12)] bg-[#f0f5fc] p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.88px] text-[#888780]">
                  Send exactly
                </p>
                <p className="mt-1 text-3xl font-extrabold text-[#1a1a2e]">
                  {paymentInfo.amount.toLocaleString()} XAF
                </p>
                <div className="mt-4 space-y-2 border-t border-[rgba(29,78,138,0.08)] pt-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#888780]">
                      To
                    </p>
                    <p className="font-mono text-lg font-bold tracking-wide text-[#1a1a2e]">
                      {paymentInfo.recipientNumber || '+237 6XX XXX XXX'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#888780]">
                      Reference
                    </p>
                    <p className="font-mono text-sm font-bold text-[#1d4e8a]">
                      {paymentInfo.reference}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#888780]">
                Screenshot must show the full transaction details including amount, recipient, and
                reference.
              </p>

              {error && (
                <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <ContinueButton
                onClick={() => setStep('upload')}
                label="I've sent the payment"
                variant={continueVariant}
              />
            </div>
          )}

          {step === 'upload' && (
            <form onSubmit={handleUpload} className="flex flex-col gap-5">
              <PlanSummaryBar plan={plan} />

              <p className="text-[13px] text-[#4a4a5e]">
                Upload a screenshot of your {method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}{' '}
                payment confirmation for {modalDisplay.label}.
              </p>

              <div>
                <label className="text-xs font-bold text-[#1a1a2e]">
                  Payment screenshot <span className="text-red-500">*</span>
                </label>
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[rgba(29,78,138,0.25)] bg-[#f8f9fa] px-6 py-10 transition hover:border-[#1d4e8a] hover:bg-[#f0f5fc]">
                  <Upload className="mb-3 h-8 w-8 text-[#888780]" />
                  <span className="text-sm font-medium text-[#1a1a2e]">
                    {fileName ?? 'Click to upload screenshot'}
                  </span>
                  <span className="mt-1 text-xs text-[#888780]">PNG or JPG, max 10 MB</span>
                  <input
                    name="screenshot"
                    type="file"
                    accept="image/*"
                    required
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setFileName(file?.name ?? null);
                    }}
                  />
                </label>
              </div>

              {error && (
                <p className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-br from-[#0f6e56] to-[#1d8a7a] px-4 py-3.5 text-[15px] font-bold text-white shadow-[0px_8px_12px_rgba(15,110,86,0.27)] transition disabled:opacity-60"
              >
                {isPending ? 'Submitting…' : 'Submit for verification'}
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(15,110,86,0.1)]">
                <Check className="h-8 w-8 text-[#0f6e56]" strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-bold text-[#1a1a2e]">Screenshot received!</h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#888780]">
                Our AI is verifying your payment. You&apos;ll receive an email within a few
                minutes. If confirmed, your plan will activate automatically.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-[14px] bg-[#f0f0f0] px-4 py-3 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#e5e5e5]"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
