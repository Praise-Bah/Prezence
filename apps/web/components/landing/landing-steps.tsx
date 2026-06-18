import Image from 'next/image';
import { Clock, Eye, Mic, Zap } from 'lucide-react';
import { LANDING_ASSETS } from '../../lib/landing-assets';
import { LANDING_STEPS } from '../../lib/landing-content';

const stepIcons = [Mic, Eye, Zap];

export function LandingSteps() {
  return (
    <section id="how-it-works" className="bg-gradient-to-b from-[#0a1a33] to-[#0d2240] py-24">
      <div className="mx-auto max-w-[1152px] px-6">
        <div className="text-center">
          <span className="inline-block rounded-full border border-[#4eedb5]/30 bg-[#4eedb5]/10 px-6 py-2 text-sm font-medium text-[#4eedb5]">
            Simple 3-step process
          </span>
          <h2 className="mx-auto mt-6 max-w-[1020px] text-4xl font-extrabold leading-tight text-white lg:text-5xl">
            From blank profile to fully live in under 20 minutes
          </h2>
          <p className="mx-auto mt-4 max-w-[540px] text-lg text-white/60">
            No writing skills needed. No tech expertise required. Just your story — we handle the
            rest.
          </p>
        </div>

        <div className="mt-16 space-y-8">
          {LANDING_STEPS.map((step, index) => {
            const Icon = stepIcons[index] ?? Mic;
            return (
              <div
                key={step.step}
                className="grid items-center gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-2 lg:p-10"
              >
                <div className={step.imageRight ? 'lg:order-1' : 'lg:order-2'}>
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1d4e8a]/40">
                      <Icon className="h-5 w-5 text-[#4eedb5]" />
                    </div>
                    <span className="rounded-full bg-[#4eedb5]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#4eedb5]">
                      STEP {step.step}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-white/70">{step.body}</p>
                  <div className="mt-4 rounded-xl border border-[#4eedb5]/20 bg-[#4eedb5]/5 px-4 py-3 text-sm text-[#4eedb5]/90">
                    {step.highlight}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-white/50">
                    <Clock className="h-4 w-4" />
                    {step.duration}
                  </div>
                </div>
                <div className={step.imageRight ? 'lg:order-2' : 'lg:order-1'}>
                  <Image
                    src={LANDING_ASSETS.featureCard}
                    alt={`${step.title} illustration`}
                    width={544}
                    height={362}
                    className="h-auto w-full rounded-2xl"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
