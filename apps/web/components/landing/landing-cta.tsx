import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCta() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[1152px] px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[#4eedb5]/20 bg-gradient-to-br from-[#1d4e8a] to-[#0f2744] px-8 py-16 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(78,237,181,0.15),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Ready to build your global presence?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Join thousands of African professionals using Prezence to stand out on every platform
              that matters.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f6e56] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d5f49]"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
