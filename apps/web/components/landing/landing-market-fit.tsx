import { CheckCircle2, TrendingUp } from 'lucide-react';
import {
  LANDING_MARKET_FIT_PLATFORMS,
  LANDING_RECOMMENDATIONS,
} from '../../lib/landing-content';

export function LandingMarketFit() {
  return (
    <section id="platforms" className="py-24">
      <div className="mx-auto max-w-[1152px] px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#4eedb5]/30 bg-[#4eedb5]/10 px-4 py-1.5 text-sm text-[#4eedb5]">
              ✦ AI-powered insight
            </span>
            <h2 className="mt-6 text-4xl font-extrabold text-white">
              Your Market-Fit Score.
              <span className="mt-2 block text-[#4eedb5]">Know exactly where to improve.</span>
            </h2>
            <p className="mt-6 max-w-[632px] text-lg leading-relaxed text-white/70">
              Prezence gives every user a live score from 0–100 that tracks how complete, relevant,
              and competitive your profiles are across every connected platform — updated in
              real time.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Platform-by-platform breakdown',
                '90-day score trend history',
                'Ranked recommendations with estimated impact',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4eedb5]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0f2744]/80 p-6 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full border-4 border-[#4eedb5]/30 bg-[#1d4e8a]/30">
                <span className="text-3xl font-extrabold text-[#4eedb5]">74</span>
              </div>
              <div>
                <p className="text-sm text-white/60">Overall market fit</p>
                <p className="text-2xl font-bold text-white">Good progress</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#4eedb5]/10 px-2 py-0.5 text-xs font-medium text-[#4eedb5]">
                  <TrendingUp className="h-3 w-3" />
                  +12 pts this week
                </span>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-4 text-sm font-semibold text-white/80">By platform</p>
              <div className="space-y-3">
                {LANDING_MARKET_FIT_PLATFORMS.map((platform) => (
                  <div key={platform.name} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm text-white/70">{platform.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#4eedb5]"
                        style={{ width: `${platform.score}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-[#4eedb5]">
                      {platform.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="mb-4 text-sm font-semibold text-white/80">Top recommendations</p>
              <ul className="space-y-3">
                {LANDING_RECOMMENDATIONS.map((rec) => (
                  <li
                    key={rec.text}
                    className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] px-4 py-3 text-sm"
                  >
                    <span className="text-white/80">{rec.text}</span>
                    <span className="shrink-0 font-semibold text-[#4eedb5]">{rec.points}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
