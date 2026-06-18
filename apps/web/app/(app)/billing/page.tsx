'use client';

import { useState } from 'react';
import type { SubscriptionPlan } from '@prezence/types';
import { PaymentFlow } from '../../../components/billing/payment-flow';

type PaidPlan = Exclude<SubscriptionPlan, 'free'>;

const plans: Array<{
  name: PaidPlan;
  price: string;
  description: string;
  features: string[];
  highlight: boolean;
}> = [
  {
    name: 'starter',
    price: '2 500 XAF/mo',
    description: 'Perfect for getting started',
    features: ['3 platform profiles', 'Full quality scores', 'Priority AI generation', 'Email support'],
    highlight: false,
  },
  {
    name: 'professional',
    price: '7 500 XAF/mo',
    description: 'For serious job seekers & freelancers',
    features: ['All 8 platform profiles', 'Market fit scores', 'Auto-publish (coming soon)', 'Priority email support'],
    highlight: true,
  },
  {
    name: 'elite',
    price: '15 000 XAF/mo',
    description: 'White-glove personal branding',
    features: ['Everything in Professional', 'Dedicated brand manager', '1-on-1 coaching session', 'Custom brand guidelines'],
    highlight: false,
  },
];

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
  const [successPlan, setSuccessPlan] = useState<PaidPlan | null>(null);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upgrade your plan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pay with MTN MoMo or Orange Money. No international card needed.
        </p>
      </div>

      {successPlan && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800">
          ✅ Payment screenshot submitted for <strong>{successPlan}</strong>. You&apos;ll receive a confirmation email shortly.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-xl border p-6 ${
              plan.highlight
                ? 'border-indigo-600 shadow-lg'
                : 'border-gray-200 bg-white'
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 inline-block w-fit rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-bold capitalize text-gray-900">{plan.name}</h3>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{plan.price}</p>
            <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-green-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedPlan(plan.name)}
              className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                plan.highlight
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Subscribe to {plan.name.charAt(0).toUpperCase() + plan.name.slice(1)} &rarr;
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
        <h3 className="font-semibold text-gray-700 mb-2">How payments work</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>Choose a plan and payment method (MTN MoMo or Orange Money)</li>
          <li>Send the exact amount to the number shown</li>
          <li>Upload a clear screenshot of your transaction</li>
          <li>Our AI verifies it in under 2 minutes and activates your plan</li>
        </ol>
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
