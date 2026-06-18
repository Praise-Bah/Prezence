'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANDING_FAQ } from '../../lib/landing-content';

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-gradient-to-b from-[#0a1a33] to-[#0d2240] py-24">
      <div className="mx-auto max-w-[768px] px-6">
        <div className="text-center">
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-6 py-2 text-sm text-white/80">
            FAQ
          </span>
          <h2 className="mt-6 text-4xl font-extrabold text-white">Common questions</h2>
        </div>

        <div className="mt-12 space-y-3">
          {LANDING_FAQ.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-white">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#4eedb5] transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-white/10 px-6 pb-5 pt-2">
                    <p className="text-sm leading-relaxed text-white/70">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
