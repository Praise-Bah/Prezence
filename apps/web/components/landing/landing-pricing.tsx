'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, Shield } from 'lucide-react';
import { LANDING_ASSETS } from '../../lib/landing-assets';
import { LANDING_PLANS } from '../../lib/landing-content';

function PaymentBadges() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span className="text-xs text-white/50">Pay with</span>
      <Image src={LANDING_ASSETS.mtnMomo} alt="MTN MoMo" width={44} height={44} />
      <Image src={LANDING_ASSETS.orangeMoney} alt="Orange Money" width={44} height={44} />
      <Image src={LANDING_ASSETS.visa} alt="Visa" width={36} height={24} />
      <Image src={LANDING_ASSETS.mastercard} alt="Mastercard" width={36} height={24} />
    </div>
  );
}

export function LandingPricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-[1152px] px-6">
        <div className="text-center">
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm text-white/80">
            Pricing
          </span>
          <h2 className="mt-6 text-4xl font-extrabold text-white">
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p className="mt-3 text-white/60">
            All prices in CFA francs. Billed monthly. Cancel anytime.
          </p>

          <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3">
            <span className="text-sm text-white/60">Accepted:</span>
            <Image src={LANDING_ASSETS.mtnMomo} alt="MTN MoMo" width={44} height={44} />
            <Image src={LANDING_ASSETS.orangeMoney} alt="Orange Money" width={44} height={44} />
            <Image src={LANDING_ASSETS.visa} alt="Visa" width={36} height={24} />
            <Image src={LANDING_ASSETS.mastercard} alt="Mastercard" width={36} height={24} />
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {LANDING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                plan.highlighted
                  ? 'border-[#4eedb5]/50 bg-[#1d4e8a]/30 shadow-[0_0_40px_rgba(78,237,181,0.15)]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              {'badge' in plan && plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#4eedb5] px-4 py-1 text-xs font-bold tracking-wide text-[#0a1a33]">
                  {plan.badge}
                </span>
              )}
              <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
                {plan.name}
              </p>
              <p className="mt-2 text-4xl font-extrabold text-white">{plan.price}</p>
              <p className="mt-1 text-sm text-white/50">{plan.period}</p>
              <p className="mt-3 text-sm text-white/70">{plan.description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#4eedb5]" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.showPayments && <PaymentBadges />}

              <Link
                href="/register"
                className={`mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? 'bg-[#0f6e56] text-white hover:bg-[#0d5f49]'
                    : 'border border-white/20 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/50">
          {['SSL encrypted', 'No password stored', 'GDPR compliant', 'Cancel anytime'].map(
            (item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#4eedb5]/60" />
                {item}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
