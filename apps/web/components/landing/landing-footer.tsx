import Image from 'next/image';
import Link from 'next/link';
import { LANDING_ASSETS } from '../../lib/landing-assets';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Platforms', href: '#platforms' },
    { label: 'FAQ', href: '#faq' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
} as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0a1a33] py-16">
      <div className="mx-auto max-w-[1152px] px-6">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src={LANDING_ASSETS.logoMark}
                alt="Prezence"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-bold text-white">Prezence</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              AI-powered personal branding for African professionals. Build your global presence
              across every platform that matters.
            </p>
            <Image
              src={LANDING_ASSETS.logoStrip}
              alt="Supported platforms"
              width={848}
              height={64}
              className="mt-6 h-8 w-auto max-w-full opacity-70"
            />
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-white">{title}</p>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Prezence. All rights reserved.
          </p>
          <p className="text-sm text-white/40">Made with ❤️ for African professionals</p>
        </div>
      </div>
    </footer>
  );
}
