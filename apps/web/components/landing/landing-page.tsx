import Image from 'next/image';
import { LANDING_ASSETS } from '../../lib/landing-assets';
import { LandingCta } from './landing-cta';
import { LandingFaq } from './landing-faq';
import { LandingFooter } from './landing-footer';
import { LandingHero, LandingNav } from './landing-hero';
import { LandingMarketFit } from './landing-market-fit';
import { LandingPricing } from './landing-pricing';
import { LandingStats } from './landing-stats';
import { LandingSteps } from './landing-steps';
import { LandingTestimonials } from './landing-testimonials';

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a1a33] text-white">
      <Image
        src={LANDING_ASSETS.background}
        alt=""
        width={1440}
        height={7000}
        className="pointer-events-none absolute left-1/2 top-0 z-0 w-full max-w-[1440px] -translate-x-1/2 object-cover object-top"
        priority
        aria-hidden
      />

      <div className="relative z-10">
        <LandingNav />
        <main>
          <LandingHero />
          <LandingStats />
          <LandingSteps />
          <LandingMarketFit />
          <LandingTestimonials />
          <LandingPricing />
          <LandingFaq />
          <LandingCta />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
