'use client';

import { useState, useTransition } from 'react';
import type { SubscriptionPlan } from '@prezence/types';
import { initiatePaymentAction, uploadScreenshotAction, type InitPaymentResult } from '../../lib/actions/billing.actions';
import { Button } from '../ui/button';

const PLAN_PRICES: Record<Exclude<SubscriptionPlan, 'free'>, string> = {
  starter: '2 500 XAF / month',
  professional: '7 500 XAF / month',
  elite: '15 000 XAF / month',
};

interface PaymentFlowProps {
  plan: Exclude<SubscriptionPlan, 'free'>;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'method' | 'instructions' | 'upload' | 'done';

export function PaymentFlow({ plan, onClose, onSuccess }: PaymentFlowProps) {
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [paymentInfo, setPaymentInfo] = useState<InitPaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function initiatePayment() {
    setError(null);
    startTransition(async () => {
      const result = await initiatePaymentAction(plan, method);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Subscribe to {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {step === 'method' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Price: <strong>{PLAN_PRICES[plan]}</strong>
            </p>
            <p className="text-sm font-medium text-gray-700">Choose payment method:</p>
            <div className="flex gap-3">
              {(['mtn_momo', 'orange_money'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-xl border-2 p-3 text-sm font-medium transition-colors ${
                    method === m
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {m === 'mtn_momo' ? '📱 MTN MoMo' : '🟠 Orange Money'}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={initiatePayment} loading={isPending} className="w-full mt-2">
              Continue →
            </Button>
          </div>
        )}

        {step === 'instructions' && paymentInfo && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Send exactly:</p>
              <p className="text-2xl font-bold text-amber-900">{paymentInfo.amount.toLocaleString()} XAF</p>
              <p className="mt-2">To: <strong>{paymentInfo.recipientNumber}</strong> ({paymentInfo.method})</p>
              <p className="mt-1">Reference: <strong>{paymentInfo.reference}</strong></p>
              <p className="mt-2 text-xs text-amber-700">Include the reference code in the payment note. Screenshot must show the full transaction details.</p>
            </div>
            <Button onClick={() => setStep('upload')} className="w-full">
              I&apos;ve sent the payment &rarr;
            </Button>
          </div>
        )}

        {step === 'upload' && (
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">Upload a screenshot of your payment confirmation.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment screenshot <span className="text-red-500">*</span>
              </label>
              <input
                name="screenshot"
                type="file"
                accept="image/*"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-indigo-700"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" loading={isPending} className="w-full">
              Submit for verification
            </Button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Screenshot received!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Our AI is verifying your payment. You&apos;ll receive an email within a few minutes. If confirmed, your plan will activate automatically.
            </p>
            <Button onClick={onClose} variant="secondary" className="w-full">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
