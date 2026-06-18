'use client';

import { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { PaymentFlow } from '../../../components/billing/payment-flow';
import { PaymentBadgesRow } from '../../../components/billing/payment-badges';
import { PLANS, type PaidPlan } from '../../../components/billing/plan-data';
import { cn } from '../../../lib/utils';

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
  const [successPlan, setSuccessPlan] = useState<PaidPlan | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div>
            <h1 className="text-[28px] font-medium leading-[42px] text-[#1a1a2e]">
              Subscription &amp; Billing
            </h1>
            <p className="mt-1 text-base text-[#888780]">
              Manage your plan and billing information
            </p>
          </div>

          {successPlan && (
            <div className="mt-6 rounded-[10px] border border-[rgba(15,110,86,0.2)] bg-[rgba(15,110,86,0.05)] px-5 py-4 text-sm text-[#0f6e56]">
              Payment screenshot submitted for{' '}
              <strong className="capitalize">{successPlan}</strong>. You&apos;ll receive a
              confirmation email shortly.
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-medium text-[#1a1a2e]">Available Plans</h2>
            <div className="mt-4 grid gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    'flex flex-col rounded-[10px] border bg-[#f8f9fa] p-6',
                    plan.highlight
                      ? 'border-[#1d4e8a] shadow-[0px_10px_8px_rgba(0,0,0,0.1),0px_4px_3px_rgba(0,0,0,0.1)] lg:-translate-y-1'
                      : 'border-[rgba(26,26,46,0.1)]',
                  )}
                >
                  <h3 className="text-base font-medium text-[#1a1a2e]">{plan.displayName}</h3>
                  <div className="mt-1 flex flex-wrap items-baseline gap-1">
                    <span className="text-2xl font-bold text-[#1a1a2e]">{plan.price}</span>
                    {plan.priceSuffix && (
                      <span className="text-sm text-[#888780]">{plan.priceSuffix}</span>
                    )}
                  </div>

                  <ul className="mt-4 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-[#1a1a2e]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0f6e56]" strokeWidth={2.5} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.showPaymentBadges && (
                    <div className="mt-4 border-t border-[rgba(26,26,46,0.08)] pt-4">
                      <PaymentBadgesRow />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan.name)}
                    className={cn(
                      'mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[10px] py-2.5 text-sm font-medium transition',
                      plan.buttonVariant === 'green-gradient'
                        ? 'bg-gradient-to-br from-[#0f6e56] to-[#1d8a7a] text-white shadow-[0px_8px_12px_rgba(15,110,86,0.35)] hover:opacity-95'
                        : 'bg-[#1d4e8a] text-[#f8f9fa] hover:bg-[#163d6e]',
                    )}
                  >
                    {plan.buttonText}
                    {plan.buttonVariant === 'green-gradient' && (
                      <ArrowRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-[10px] border border-[rgba(26,26,46,0.1)] bg-[#f8f9fa] p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#1d4e8a]" />
              <div>
                <h3 className="text-base font-medium text-[#1a1a2e]">How payments work</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[#888780]">
                  <li>Choose a plan and payment method (MTN MoMo or Orange Money)</li>
                  <li>Send the exact amount to the number shown</li>
                  <li>Upload a clear screenshot of your transaction</li>
                  <li>Our AI verifies it in under 2 minutes and activates your plan</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedPlan && (
        <PaymentFlow
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            setSuccessPlan(selectedPlan);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
}
