import Image from 'next/image';
import { Quote } from 'lucide-react';
import { LANDING_ASSETS } from '../../lib/landing-assets';
import { LANDING_TESTIMONIALS } from '../../lib/landing-content';

const avatarMap = {
  testimonialAmara: LANDING_ASSETS.testimonialAmara,
  testimonialKevin: LANDING_ASSETS.testimonialKevin,
  testimonialGrace: LANDING_ASSETS.testimonialGrace,
} as const;

export function LandingTestimonials() {
  return (
    <section className="bg-gradient-to-b from-[#0d2240] to-[#0a1a33] py-24">
      <div className="mx-auto max-w-[1152px] px-6">
        <div className="text-center">
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm text-white/80">
            Success stories
          </span>
          <h2 className="mx-auto mt-6 max-w-[1020px] text-4xl font-extrabold leading-tight text-white">
            African professionals are winning global opportunities with Prezence
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {LANDING_TESTIMONIALS.map((item) => (
            <article
              key={item.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6"
            >
              <Quote className="h-5 w-5 text-[#4eedb5]/60" />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-white/80">{item.quote}</p>
              <div className="mt-6 flex gap-2">
                <span className="rounded-full bg-[#4eedb5]/10 px-2.5 py-1 text-xs font-medium text-[#4eedb5]">
                  Score: {item.score}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/70">
                  {item.platforms}
                </span>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6">
                <Image
                  src={avatarMap[item.avatarKey]}
                  alt={item.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/50">{item.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
