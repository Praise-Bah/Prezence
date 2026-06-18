import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, Star } from 'lucide-react';
import { LANDING_ASSETS } from '../../lib/landing-assets';

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1a33]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={LANDING_ASSETS.logoMark}
            alt="Prezence"
            width={56}
            height={56}
            className="h-14 w-14"
            priority
          />
          <span className="text-sm font-bold tracking-[0.2em] text-white">PREZENCE</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#how-it-works" className="text-sm text-white/80 transition hover:text-white">
            How it works
          </a>
          <a href="#platforms" className="text-sm text-white/80 transition hover:text-white">
            Platforms
          </a>
          <a href="#pricing" className="text-sm text-white/80 transition hover:text-white">
            Pricing
          </a>
          <a href="#faq" className="text-sm text-white/80 transition hover:text-white">
            FAQ
          </a>
        </nav>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0f6e56] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(15,110,86,0.4)] transition hover:bg-[#0d5f49]"
        >
          Get started free
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

export function LandingHero() {
  const avatarColors = ['#0f6e56', '#5b2d8e', '#1d8a7a', '#1d4e8a', '#b7770d'];

  return (
    <section className="mx-auto max-w-[1440px] px-6 pb-16 pt-12 lg:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[848px_1fr] lg:gap-8">
        <div className="max-w-[848px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(91,45,142,0.5)] bg-[rgba(91,45,142,0.3)] px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#c4a6e8]" />
            <span className="text-xs font-semibold text-[#c4a6e8]">AI-powered personal branding</span>
          </div>

          <h1 className="max-w-[654px] text-[2.85rem] font-extrabold leading-[1.1] tracking-tight text-white lg:text-[2.85rem]">
            Your professional presence.{' '}
            <span className="text-[#4eedb5]">Everywhere.</span>
          </h1>

          <p className="mt-6 max-w-[500px] text-lg leading-[1.7] text-white/75">
            Prezence interviews you, builds your profiles on LinkedIn, Fiverr, Instagram, and 5
            more platforms — then keeps them updated automatically. Built for African youth.
            Designed for global reach.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2">
              {avatarColors.map((color, i) => (
                <div
                  key={color}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1d4e8a] text-[10px] font-bold text-white"
                  style={{ backgroundColor: color, zIndex: avatarColors.length - i }}
                >
                  {['AT', 'KM', 'GF', 'JN', 'SN'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-[#f5a623] text-[#f5a623]" />
                ))}
              </div>
              <p className="text-xs text-white/60">1,284+ users across Cameroon</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-[14px] bg-[#0f6e56] px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_4px_12px_rgba(15,110,86,0.4)] transition hover:bg-[#0d5f49]"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[14px] border border-white/20 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/15"
            >
              <Play className="h-4 w-4 fill-white" />
              Watch demo
            </button>
          </div>

          <p className="mt-4 text-base text-white">
            Manages your presence on
          </p>

          <div className="mt-3 overflow-hidden rounded-2xl bg-white/[0.03] px-4 py-2">
            <Image
              src={LANDING_ASSETS.logoStrip}
              alt="Supported platforms"
              width={848}
              height={64}
              className="h-14 w-full max-w-[480px] object-contain object-left"
            />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[644px] lg:mx-0">
          <Image
            src={LANDING_ASSETS.heroIllustration}
            alt="User chatting with Prezence AI on a smartphone"
            width={644}
            height={517}
            className="h-auto w-full"
            priority
          />
        </div>
      </div>
    </section>
  );
}
