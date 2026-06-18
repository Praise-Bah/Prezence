import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Prezence — AI Personal Branding for African Youth' };

const platforms = ['LinkedIn', 'GitHub', 'Instagram', 'TikTok', 'Fiverr', 'Facebook', 'Freelancer', 'Twitter / X'];

const features = [
  { icon: '🎤', title: 'One interview, eight profiles', body: 'Answer 9 questions once. We generate optimised profiles for all your platforms.' },
  { icon: '🤖', title: 'Powered by Claude AI', body: 'Claude Sonnet writes your bio, Gemini Flash scores it for quality and character limits.' },
  { icon: '📊', title: 'Market fit score', body: 'See exactly how complete and keyword-rich your profiles are, with improvement tips.' },
  { icon: '🌍', title: 'Built for Africa', body: 'Supports English, French, and Camfranglais. Understands local context and career journeys.' },
];

const plans = [
  { name: 'Free', price: '0 XAF', features: ['1 platform profile', 'Basic quality score', 'Community support'] },
  { name: 'Starter', price: '2 500 XAF/mo', features: ['3 platform profiles', 'Full quality scores', 'Priority generation'], highlight: false },
  { name: 'Professional', price: '7 500 XAF/mo', features: ['All 8 platforms', 'Auto-publish (coming)', 'Email support'], highlight: true },
  { name: 'Elite', price: '15 000 XAF/mo', features: ['Everything in Pro', 'Dedicated manager', '1-on-1 coaching'], highlight: false },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-indigo-600">Prezence</span>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:block">
              Features
            </Link>
            <Link href="#pricing" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:block">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 py-24 text-center">
          <div className="mb-4 inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-600">
            Built for African youth 🌍
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-gray-900">
            Your personal brand,
            <br />
            <span className="text-indigo-600">powered by AI</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-gray-600">
            Answer 9 questions. Get AI-crafted profiles for LinkedIn, GitHub, Instagram, TikTok, and 4 more platforms — in English, French, or Camfranglais.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="w-full rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 sm:w-auto"
            >
              Build my brand for free →
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-gray-300 px-8 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card required · Free plan forever</p>
        </section>

        {/* Platform logos */}
        <section className="border-y border-gray-100 bg-gray-50 py-10">
          <p className="mb-6 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
            Generate profiles for
          </p>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-4 px-4">
            {platforms.map((p) => (
              <span
                key={p}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-5xl px-4 py-24">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Everything you need to stand out
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 p-6">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-gray-50 py-24">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">Simple pricing</h2>
            <p className="mb-12 text-center text-gray-600">Pay with MTN MoMo or Orange Money. No international card needed.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-6 ${
                    plan.highlight
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.highlight && (
                    <span className="mb-3 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`mb-4 text-2xl font-bold ${plan.highlight ? 'text-white' : 'text-indigo-600'}`}>
                    {plan.price}
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-indigo-100' : 'text-gray-600'}`}>
                        <span>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-medium transition-colors ${
                      plan.highlight
                        ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {plan.name === 'Free' ? 'Get started' : 'Subscribe'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Start building your brand today
            </h2>
            <p className="mb-8 text-gray-600">
              Join thousands of young Africans who use Prezence to land jobs, freelance clients, and opportunities.
            </p>
            <Link
              href="/register"
              className="inline-block rounded-xl bg-indigo-600 px-10 py-4 text-base font-semibold text-white hover:bg-indigo-700"
            >
              Create my free account →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Prezence · AI-powered personal branding for African youth
      </footer>
    </div>
  );
}
