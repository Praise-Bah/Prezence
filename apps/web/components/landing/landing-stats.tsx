import { LANDING_STATS } from '../../lib/landing-content';

export function LandingStats() {
  return (
    <section className="mx-auto max-w-[1188px] px-6 py-12">
      <div className="grid grid-cols-2 gap-8 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 md:grid-cols-4">
        {LANDING_STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-4xl font-extrabold text-[#4eedb5]">{stat.value}</p>
            <p className="mt-2 text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
